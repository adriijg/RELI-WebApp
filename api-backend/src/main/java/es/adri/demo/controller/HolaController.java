package es.adri.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HolaController {

    @GetMapping("/")
    public String home() {
        return "¡Conexión exitosa! El backend de RELI-WebApp está funcionando.";
    }
}
