import { Database } from "./js/Database.js";
import http from "http";
import mysql from "mysql2/promise";
import { CONSTANTS } from "./js/utils/constants.js";
import { STRINGS } from "./lang/messages/en/user.js";
import url from "url";

const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
});

const db = new Database(connection);
db.initialize();

const writerPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || CONSTANTS.FALLBACK_PORT,
    database: CONSTANTS.DATABASE,
    user: CONSTANTS.WRITER,
})

const readerPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || CONSTANTS.FALLBACK_PORT,
    database: CONSTANTS.DATABASE,
    user: CONSTANTS.READER,
})



http.createServer(async function (req, res) {
    if (req.method === "GET") {
        const data = url.parse(req.url, true);
        const sql_cmd = data.query["cmd"]; 
        const result = await readerPool.query(sql_cmd);
        
        res.end(JSON.stringify(result));
    } else if (req.method === "POST") {
        let data = "";

        req.on("data", (chunk) => {
            data += chunk;
        });

        req.on("end", async () => {
            const rows = JSON.parse(data);
            db.createTable();
            let sql = "INSERT INTO patients (name, dateOfBirth) VALUES ?";
            writerPool.query(sql, [rows]);
            res.setHeader("Content-Type", "text/plain");
            res.setHeader("Access-Control-Allow-Origin", "*");
            const total_rows = await db.checkTable();
            res.write(STRINGS.NUM_ROWS_ADDED + total_rows);
            res.end();
        });
    }
}).listen(8888);