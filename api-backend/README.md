# Apuntes de SpringBoot.

Nombre: Adrián Junquera.

Fecha: 16-03-26.

---

## ¿En que consiste SpringBoot?

...

## Estructura de SpringBoot.

En el framework podemos encontrar las siguientes estructuras:

- **Controller**: Recibe las peticiones HTTP y devuelve una respuesta (JSON). "No sabe cocinar, solo quién debe hacerlo". ``@RestController``
 
```java
// Ejemplo
@GetMapping("/{id}")
public Tarea obtenerTarea(@PathVariable Long id) {
    return tareaService.buscarPorId(id); // Le pasa el trabajo al servicio
}
```

- **Service**: Es donde ocurre la lógica del negocio. Es la parte más importante. ``@Service``

```java
public Tarea guardarTarea(Tarea tarea) {
    if (tarea.getDescripcion().isEmpty()) {
        throw new RuntimeException("La descripción es obligatoria");
    }
    return tareaRepository.save(tarea); // Le pide al pinche que guarde el ingrediente
}
```
- **Repository**: Es la que tiene acceso a la Base de Datos. Su trabajo es buscar, guardar y sacar ingredientes. Gracias a Spring Data JPA no hay que escribir código para buscar. ``@Repository``

````java
// No escribes código, solo defines la interfaz
public interface TareaRepository extends JpaRepository<Tarea, Long> { }
````
- **Entity**: Es la definición de lo que estamos manejando. En Hibernate, esta clase le dice a la base de datos que columnas debe tener la tabla. ``@Entity``
- **DTO**: Versión "recortada" de un objeto solo para transporte. No pasa datos como por ejemplo, una contraseña.

## Cosas a tener en cuenta.

- **CORS**: Cross-Origin Resource Sharing o Intercambio de Recursos de Origen Cruzado, es un mecanismo de seguridad del navegador que evita que webs maliciosas lean datos de otros servidores. Para que tu propia web (Angular) pueda leer de tu propio servidor (Spring), tienes que configurar el servidor para que "reconozca" a la web como un sitio de confianza.

## Algunos problemas...

- Puerto 8080 ocupado.
  - Escribir ``netstat -ano | findstr :8080`` para ver que esta utilizando el puerto.
  - Usar ``taskkill  /F /PID numero_que_nos_da`` para matar el proceso.