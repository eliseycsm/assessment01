const express = require('express')
const handlebars = require('express-handlebars')
const withQuery = require('with-query').default
const fetch = require('node-fetch')
const mysql = require('mysql2/promise')
const morgan = require('morgan')

const app = express()

app.use(morgan('combined'))

//env
const PORT = process.env.PORT || 3000;

//create database connection pool
const pool = mysql.createPool({

    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'goodreads',
    user: process.env.DB_USER, //DO NOT HAVE DEFAULT USER
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    //other attributes we need include timezone and connectionTimeOut
    timezone: '+08:00'
})




//handlebars config
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')


app.get(["/", "/index.html"], (req, resp) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("")
    const numerals = "0123456789".split("")

    resp.status(200)
    resp.type('text/html')
    resp.render('index', {
        alphabet ,
        numerals
    })
})

//process startWith
app.get("/startsWith", async (req, resp) => {
    const keyLetter = req.query["q"]
    console.info('key letter: ', keyLetter)
    resp.status(200)
    resp.type('text/html')
    resp.end("search is working")

    try {

        const conn = await pool.getConnection()


    } catch(e){
        console.error("Error found: ", e)
    } finally{
        conn.release()
    }

})

//capture error pages and redirect to main
app.use((req, resp) => {
    resp.status(404)
    resp.type('text/html')
    resp.redirect("/")
})

//ping db to make sure connection is there & start server
const startApp = async(app, pool) => {
    try{
        //acquire connection from connection pool
        const conn = await pool.getConnection()

        console.info('Pinging database...')
        await conn.ping() 

        //release connection
        conn.release()

        //start server
        if(!PORT) {
            console.error(`port number is missing`)
        } else {
            app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`)
        })
}
    }catch(e) {
        console.error('Cannot ping database: ', e)
    }

}
startApp(app, pool)