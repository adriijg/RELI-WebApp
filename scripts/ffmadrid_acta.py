#!/usr/bin/env python3
"""Descarga y parseo automatico del acta (ficha de partido) de la FFM (Novanet).

El calendario ya da resultado global, pero el acta trae el detalle:
goles por jugador+minuto, tarjetas (amarilla/roja/doble), convocatoria
(titulares/suplentes con dorsal), cuerpo tecnico, arbitro, estadio e incidencias.

Uso:
    pip install requests
    # credenciales solo en memoria / .env (nunca en el repo):
    set FFM_USER=... & set FFM_PASS=...
    python scripts/ffmadrid_acta.py --codacta 78450 --out acta-78450.json
    python scripts/ffmadrid_acta.py --jornada 1 --competicion 320164 --grupo 320174 --temporada 21 --out actas-j1.json

Origen del enlace (verificado 23-09-2026):
- La pagina de jornada (NFG_CmpJornada) trae por partido:
  /nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa=<COD>&cod_acta=<COD>
- Esa ficha (NFG_CmpPartido) es el acta en HTML.
- Existe ademas PDF de alineaciones:
  /nfg/NPcd/NFG_CMP_Alineacion_Resultados?cod_primaria=1000128&codacta=<COD>&NPcd_Pdf=1
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import os
import re
import sys
from datetime import datetime

import requests

import ffmadrid as f

BASE = "https://parla.ffmadrid.es"

RE_CODACTA = re.compile(r"NFG_CmpPartido\?cod_primaria=\d+&CodActa=(\d+)&cod_acta=\d+", re.I)
RE_FECHA = re.compile(r"Fecha:</span>(?:\s|&nbsp;)*(\d{2}-\d{2}-\d{4})")
RE_HORA = re.compile(r"Hora:</span>(?:\s|&nbsp;)*(\d{2}:\d{2})")
RE_JORNADA = re.compile(r"Jornada\s+(\d+)")
RE_EQUIPOS = re.compile(r'<span class="tituloprograma">\s*(.*?)\s*</span>', re.S)
RE_ESTADIO = re.compile(r"ESTADIO:</span>(.*?)</td>", re.S)
RE_COMPETICION = re.compile(r'<span class="title">\s*([^<]*AFICIONADO[^<]*)</span>', re.S)
RE_PLAYER_ROW = re.compile(
    r"<td[^>]*>&nbsp;&nbsp;(\d+)&nbsp;.*?</td>\s*<td[^>]*><p[^>]*>&nbsp;(.*?)</p>",
    re.S,
)
RE_CARD_ROW = re.compile(
    r"((?:<img[^>]*tarj_[^>]*>\s*(?:&nbsp;)?)+)\s*</td>\s*<td[^>]*>\s*<p[^>]*>\s*(.*?)\s*</p>",
    re.S,
)
RE_CARD_WHO = re.compile(r"(.*?)\s*\((\d+)'\)\s*$")
RE_ARBITROS_BLOCK = re.compile(
    r"&Aacute;RBITROS(.*?)GOLES", re.S | re.I
)
RE_GOLES_BLOCK = re.compile(r">GOLES</span>(.*?)ESTADIO", re.S | re.I)


def clean(text: str | None) -> str | None:
    if text is None:
        return None
    text = htmlmod.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def strip_tags(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return clean(text) or ""


def get_codactas(session: requests.Session, jornada: int, params: dict) -> list[str]:
    html = f.get_jornada(session, jornada, params)
    seen: set[str] = set()
    out: list[str] = []
    for m in RE_CODACTA.finditer(html):
        if m.group(1) not in seen:
            seen.add(m.group(1))
            out.append(m.group(1))
    return out


def fetch_acta(session: requests.Session, codacta: str) -> str:
    url = f"{BASE}/nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa={codacta}&cod_acta={codacta}"
    r = session.get(url, timeout=30)
    r.raise_for_status()
    # La FFM sirve el acta como ISO-8859-15 (ver Content-Type), no UTF-8.
    try:
        return r.content.decode("utf-8")
    except UnicodeDecodeError:
        return r.content.decode("iso-8859-15")


def split_teams(html: str) -> tuple[str, str, str, str]:
    """Devuelve (bloque_local, bloque_visitante, nombre_local, nombre_visitante)."""
    names = [clean(n) for n in RE_EQUIPOS.findall(html)]
    # La pagina repite cabeceras; los dos equipos estan en los dos primeros tituloprograma
    home = names[0] if len(names) > 0 else None
    away = names[1] if len(names) > 1 else None
    # Divide por la marca central del resultado "4</span> ... - ... 5</span>" es fragil;
    # mejor: parte por la segunda aparicion del nombre visitante? Usamos ARBITROS como frontera:
    # bloque1 = hasta ARBITROS (local + centro), bloque2 = desde ARBITROS? No: tarjetas de cada
    # equipo estan en columnas distintas. En su lugar localizamos los dos bloques de equipo
    # por posicion de cada tituloprograma.
    positions = [m.start() for m in RE_EQUIPOS.finditer(html)]
    goles_pos = html.find("GOLES")
    if len(positions) >= 2:
        local_block = html[positions[0] : positions[1]]
        end = goles_pos if goles_pos > positions[1] else len(html)
        away_block = html[positions[1] : end]
    else:
        local_block, away_block = html, ""
    return local_block, away_block, home, away


def parse_players(block: str) -> tuple[list[dict], list[dict], dict]:
    """Titulares / suplentes / cuerpo tecnico dentro del bloque de un equipo."""
    tits: list[dict] = []
    subs: list[dict] = []
    staff: dict = {}
    # Titulares: entre "Titulares:" y "Suplentes:"
    ti = block.find("Titulares:")
    si = block.find("Suplentes:")
    ci = block.find("CUERPO")
    tit_seg = block[ti:si] if ti >= 0 and si > ti else ""
    sub_seg = block[si:ci] if si >= 0 and ci > si else (block[si:] if si >= 0 else "")
    for m in RE_PLAYER_ROW.finditer(tit_seg):
        tits.append({"dorsal": int(m.group(1)), "nombre": clean(m.group(2))})
    for m in RE_PLAYER_ROW.finditer(sub_seg):
        subs.append({"dorsal": int(m.group(1)), "nombre": clean(m.group(2))})
    staff_seg = block[ci:] if ci >= 0 else ""
    staff_txt = strip_tags(staff_seg)
    for rol in ("DELEGADO EQUIPO", "ENTRENADOR"):
        mm = re.search(rol + r"\s+(.*?)(?:ENTRENADOR|SUSTITUCIONES|TARJETAS|$)", staff_txt)
        if mm:
            staff[rol.lower().replace(" ", "_")] = clean(mm.group(1))
    return tits, subs, staff


def parse_cards(block: str, side: str) -> list[dict]:
    out: list[dict] = []
    ti = block.find("TARJETAS")
    seg = block[ti : ti + 6000] if ti >= 0 else ""
    for m in RE_CARD_ROW.finditer(seg):
        imgs, who = m.group(1), clean(m.group(2))
        has_amar = "tarj_amar" in imgs
        has_roja = "tarj_roja" in imgs
        tipo = "DOBLE_AMARILLA" if (has_amar and has_roja) else ("ROJA" if has_roja else "AMARILLA")
        wm = RE_CARD_WHO.match(who or "")
        out.append({
            "equipo": side,
            "jugador": clean(wm.group(1)) if wm else who,
            "minuto": int(wm.group(2)) if wm else None,
            "tipo": tipo,
        })
    # La FFM a veces duplica la misma fila (mismo jugador+minuto+tipo): se deja una.
    seen: set[tuple] = set()
    uniq: list[dict] = []
    for c in out:
        key = (c["jugador"], c["minuto"], c["tipo"])
        if key not in seen:
            seen.add(key)
            uniq.append(c)
    return uniq


def parse_goals(html: str, home: str, away: str) -> list[dict]:
    out: list[dict] = []
    gb = RE_GOLES_BLOCK.search(html)
    seg = gb.group(1) if gb else html
    # Una fila por gol: se parsea por <tr> para no cruzar filas con un regex gigante.
    for tr in re.finditer(r"<tr>(.*?)</tr>", seg, re.S | re.I):
        row = tr.group(1)
        mp = re.search(r"(\d+)\s*-\s*(\d+)", strip_tags(row.split("</td>")[0]))
        mt = re.search(r'title="([^"]*)"', row)
        # Celda del goleador: segunda celda del tr
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S | re.I)
        if not mp or len(cells) < 2:
            continue
        who_txt = strip_tags(cells[1])
        mw = re.search(r"(.*?)\s*\((\d+)'", who_txt)
        if not mw:
            continue
        hg, ag = int(mp.group(1)), int(mp.group(2))
        out.append({
            "parcial": f"{hg}-{ag}",
            "home_goals": hg,
            "away_goals": ag,
            "jugador": clean(mw.group(1)),
            "minuto": int(mw.group(2)),
            "tipo": clean(mt.group(1)) if mt else None,
        })
    # Asigna lado local/visitante por evolucion del marcador.
    prev_h, prev_a = 0, 0
    for g in out:
        if g["home_goals"] > prev_h and g["away_goals"] == prev_a:
            g["equipo"] = "local"
            g["equipo_nombre"] = home
        elif g["away_goals"] > prev_a and g["home_goals"] == prev_h:
            g["equipo"] = "visitante"
            g["equipo_nombre"] = away
        else:
            g["equipo"] = None
            g["equipo_nombre"] = None
        prev_h, prev_a = g["home_goals"], g["away_goals"]
    return out


def parse_acta(html: str, codacta: str) -> dict:
    mf = RE_FECHA.search(html)
    mh = RE_HORA.search(html)
    mj = RE_JORNADA.search(html)
    mc = RE_COMPETICION.search(html)
    me = RE_ESTADIO.search(html)
    local_block, away_block, home, away = split_teams(html)

    home_tit, home_sub, home_staff = parse_players(local_block)
    away_tit, away_sub, away_staff = parse_players(away_block)

    ab = RE_ARBITROS_BLOCK.search(html)
    arbitros = []
    if ab:
        for m in re.finditer(r'<td class="textosm">\s*(.*?)\s*</td>', ab.group(1), re.S):
            name = clean(m.group(1))
            if name and len(name) > 3:
                arbitros.append(name)

    goles = parse_goals(html, home, away)
    tarjetas = parse_cards(local_block, "local") + parse_cards(away_block, "visitante")

    for t in tarjetas:
        t["equipo_nombre"] = home if t["equipo"] == "local" else away

    mi = html.find("INCIDENCIAS")
    incidencias = None
    if mi >= 0:
        # El texto va en el div posterior; si esta vacio, no hay incidencias.
        md = re.search(
            r"INCIDENCIAS.*?<\s*div[^>]*width:\s*80%[^>]*>(.*?)</\s*div",
            html[mi : mi + 6000],
            re.S | re.I,
        )
        if md:
            txt = strip_tags(md.group(1))
            incidencias = txt or None

    iso = None
    if mf:
        hora = mh.group(1) if mh else "00:00"
        try:
            iso = datetime.strptime(f"{mf.group(1)} {hora}", "%d-%m-%Y %H:%M").strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            iso = None

    resultado = None
    if goles:
        resultado = {"home": goles[-1]["home_goals"], "away": goles[-1]["away_goals"]}

    return {
        "codacta": codacta,
        "fecha": iso,
        "competicion": clean(mc.group(1)) if mc else None,
        "jornada": int(mj.group(1)) if mj else None,
        "estadio": strip_tags(me.group(1)) if me else None,
        "local": {"nombre": home, "titulares": home_tit, "suplentes": home_sub, "staff": home_staff},
        "visitante": {"nombre": away, "titulares": away_tit, "suplentes": away_sub, "staff": away_staff},
        "arbitros": arbitros,
        "goles": goles,
        "tarjetas": tarjetas,
        "resultado": resultado,
        "incidencias": incidencias,
        "url": f"{BASE}/nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa={codacta}&cod_acta={codacta}",
        "url_pdf_alineaciones": f"{BASE}/nfg/NPcd/NFG_CMP_Alineacion_Resultados?cod_primaria=1000128&codacta={codacta}&NPcd_Pdf=1",
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Descarga y parsea actas FFM")
    ap.add_argument("--codacta", default="", help="CodActa concreto (ej. 78450). Admite lista separada por comas.")
    ap.add_argument("--jornada", type=int, default=0, help="Descubre los CodActa de esa jornada y los descarga todos")
    ap.add_argument("--out", default="", help="Guarda JSON (un acta -> objeto; varios -> lista)")
    ap.add_argument("--cod-primaria", default="1000128")
    ap.add_argument("--competicion", default="324545")
    ap.add_argument("--grupo", default="324568")
    ap.add_argument("--temporada", default="22")
    ap.add_argument("--agrupacion", default="1")
    ap.add_argument("--tipo-juego", default="3")
    args = ap.parse_args()

    ffm_user = os.environ.get("FFM_USER", "")
    ffm_pass = os.environ.get("FFM_PASS", "")
    if not ffm_user or not ffm_pass:
        print("Faltan FFM_USER / FFM_PASS en el entorno.", file=sys.stderr)
        return 2

    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (RELI-WebApp acta scraper)"
    f.login(session, ffm_user, ffm_pass)
    print("Login FFM OK")

    cods: list[str] = []
    if args.codacta:
        cods = [c.strip() for c in args.codacta.split(",") if c.strip()]
    elif args.jornada:
        params = {
            "cod_primaria": args.cod_primaria,
            "CodCompeticion": args.competicion,
            "CodGrupo": args.grupo,
            "CodTemporada": args.temporada,
            "cod_agrupacion": args.agrupacion,
            "Sch_Tipo_Juego": args.tipo_juego,
        }
        cods = get_codactas(session, args.jornada, params)
        print(f"Jornada {args.jornada}: {len(cods)} actas {cods}")
    else:
        print("Indica --codacta y/o --jornada", file=sys.stderr)
        return 2

    actas = []
    for cod in cods:
        try:
            html = fetch_acta(session, cod)
        except requests.HTTPError:
            f.login(session, ffm_user, ffm_pass)
            html = fetch_acta(session, cod)
        acta = parse_acta(html, cod)
        print(f"  {cod}: {acta['local']['nombre']} {acta['resultado']} vs {acta['visitante']['nombre']} "
              f"({len(acta['goles'])} goles, {len(acta['tarjetas'])} tarjetas)")
        actas.append(acta)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(actas[0] if len(actas) == 1 else actas, fh, ensure_ascii=False, indent=2)
        print(f"Guardado en {args.out}")
    else:
        print(json.dumps(actas[0] if len(actas) == 1 else actas, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
