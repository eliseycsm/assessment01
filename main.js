const express = require('express')
const handlebars = require('express-handlebars')
const withQuery = require('with-query').default
const fetch = require('node-fetch')
const mysql = require('mysql2/promise')
const morgan = require('morgan')

const app = express()

app.use(morgan('combined'))

//SQL
const SQL_FIND_BY_STARTING_KEY = 'select book_id, title from book2018 where title like ? ORDER BY TITLE ASC LIMIT ? OFFSET ?'
const SQL_TOTAL_BOOKS_WITH_STARTING_KEY = 'select count(*) as q_count from book2018 where title like ? '
const LIMIT = 10

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



//process search for startKey
app.get("/search", async (req, resp) => {
    const startKey = req.query["q"]    
    const conn = await pool.getConnection()
    const OFFSET = parseInt(req.query['offset']) || 0

    try {    
        const result = await conn.query(SQL_FIND_BY_STARTING_KEY, [`${startKey}%`, LIMIT, OFFSET])
        const listOfBooks = result[0]
        const bookCount = await conn.query(SQL_TOTAL_BOOKS_WITH_STARTING_KEY, [`${startKey}%`])
        const numOfBooks = bookCount[0][0]['q_count']
        console.info("numOfBooks", numOfBooks)

        resp.status(200)
        resp.type('text/html')
        resp.render('listBooks', {
            listOfBooks,
            hasResults: listOfBooks.length > 0,
            q: startKey,
            prevOffset: Math.max(0, OFFSET - LIMIT),
            nextOffset: (OFFSET + LIMIT),
            noMoreNext: (OFFSET + LIMIT) < numOfBooks
        })

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