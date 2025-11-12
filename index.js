//Importamos las librarías requeridas
const express = require('express')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose();

//Documentación en https://expressjs.com/en/starter/hello-world.html
const app = express()

//Creamos un parser de tipo application/json
//Documentación en https://expressjs.com/en/resources/middleware/body-parser.html
const jsonParser = bodyParser.json()


// Abre la base de datos de SQLite
let db = new sqlite3.Database('./base.sqlite3', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos SQLite.');

    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        todo TEXT NOT NULL,
        created_at INTEGER
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Tabla tareas creada o ya existente.');
        }
    });
});

// <-- ADAPTACIÓN 1: Cambiamos el endpoint de '/insert' a '/agrega_todo'
app.post('/agrega_todo', jsonParser, function (req, res) {
    //Imprimimos el contenido del campo todo
    const { todo } = req.body;
    
    console.log("Tarea recibida:", todo);
    res.setHeader('Content-Type', 'application/json');
    
    if (!todo) {
        // Usamos return para detener la ejecución aquí
        return res.status(400).send({ error: 'Falta información necesaria' });
    }
    
    const stmt = db.prepare('INSERT INTO todos (todo, created_at) VALUES (?, CURRENT_TIMESTAMP)');

    // <-- ADAPTACIÓN 2: Mover la respuesta DENTRO del callback
    // Esto asegura que respondemos DESPUÉS de que la BD termine.
    stmt.run(todo, (err) => {
        if (err) {
          console.error("Error running stmt:", err);
          // Enviamos una respuesta de error si la inserción falla
          return res.status(500).send({ error: err.message });
        } else {
          console.log("Insert was successful!");
          // Enviamos la respuesta de éxito (201) SÓLO si todo salió bien
          res.status(201).send();
        }
    });

    stmt.finalize();
    
    // ¡ERROR COMÚN! No debemos enviar la respuesta aquí fuera,
    // porque se enviaría ANTES de que la base de datos termine.
    // La línea res.status(201).send() fue movida arriba.
})


// <-- ADAPTACIÓN 3: Modificamos el GET / para que devuelva las tareas
app.get('/', function (req, res) {
    console.log("Petición GET / recibida, consultando tareas...");
    
    // Preparamos la consulta SQL para obtener todas las tareas
    const sql = "SELECT * FROM todos ORDER BY created_at ASC";

    db.all(sql, [], (err, rows) => {
        res.setHeader('Content-Type', 'application/json');
        
        if (err) {
            console.error("Error al consultar la base de datos:", err);
            res.status(500).send({ error: err.message });
            return;
        }

        console.log(`Consulta exitosa, ${rows.length} tareas encontradas.`);
        
        // Enviamos la lista de tareas (el arreglo 'rows') como JSON
        res.status(200).json(rows);
    });
})


//Este endpoint no lo usamos en la app, pero puede quedarse
app.post('/login', jsonParser, function (req, res) {
    console.log(req.body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 'status': 'ok' }));
})

//Corremos el servidor en el puerto 3000
const port = 3000;

app.listen(port, () => {
    console.log(`Aplicación corriendo en http://localhost:${port}`)
})