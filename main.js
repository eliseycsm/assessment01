const express = require('express')
const handlebars = require('express-handlebars')
const withQuery = require('with-query').default
const fetch = require('node-fetch')
const mysql = require('mysql2/promise')
const morgan = require('morgan')

const app = express()

app.use(morgan('combined'))