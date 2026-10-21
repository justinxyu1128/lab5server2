import { CONSTANTS } from "./utils/constants.js";

export class Database {
    constructor(connection) {
        this.connection = connection;
    }

    async createUser(user) {
        await this.connection.query(
            `CREATE USER IF NOT EXISTS ${user}
            @${process.env.MYSQLHOST}`
        );
    }

    async grantPrivilege(user, privilege) {
        await this.connection.query(
            `GRANT ${privilege} ON ${CONSTANTS.DATABASE}.* TO 
            ${user}
            @${process.env.MYSQLHOST} `
        )
    }

    createWriter(user) {
        this.createUser(user);
        this.grantPrivilege(user, CONSTANTS.WRITER_PRIVILEGE);
    }

    createReader(user) {
        this.createUser(user);
        this.grantPrivilege(user, CONSTANTS.READER_PRIVILEGE);
    }

    async createTable() {
        await this.connection.query(`CREATE TABLE IF NOT EXISTS patients (
            patientid INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            dateOfBirth datetime,
            PRIMARY KEY (patientid)
            ) Engine=innodb;`);
    }

    async checkTable() {
        const [rows] = await this.connection.query(
            `SELECT COUNT(*) AS count FROM ${CONSTANTS.TABLE}`
        );
        return rows[0].count;
    }

    async initialize() {
        await this.connection.query(`CREATE DATABASE IF NOT EXISTS ${CONSTANTS.DATABASE}`);
        await this.connection.query(`USE ${CONSTANTS.DATABASE}`);
        this.createTable;
        this.createReader(CONSTANTS.READER);
        this.createWriter(CONSTANTS.WRITER);
    }
}