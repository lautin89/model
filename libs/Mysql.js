/*
 * mysql数据库驱动模块
 * 1、执行mysql连接
 * 2、封装增删改和查询方法
 * 3、关闭数据库连接
 */

//加载第三方扩展 - 模块形式
const mysql = require("mysql");

class Mysql {

    constructor(settings = {}) {
        //用户配置覆盖默认配置 并写入实例对象中
        Object.assign(this, settings);

        //执行数据库连接
        this.link = mysql.createConnection(this);

        this.link.connect((err) => {
            if (err) {
                //格式化数据库错误
                this.errLogs(err);
            } else {
                console.log(`>>>>>>>>数据库连接成功(${this.link.threadId})>>>>>>`);
            }
        });
    }

    /**
     * 执行sql语句的方法，查询返回对象集合的数组
     *                  增删改返回OkPacket对象
     * @param {string} sql 要执行的sql语句
     * @returns {object} promise 返回PMS对象
     */
    query(sql) {
        return new Promise((resolve, reject) => {

            this.link.query(sql, (err, result) => {
                if (err) reject(this.errLogs(err));
                else {
                    //回调函数 接收返回的结果
                    resolve(result);
                }
            });

            // this.link.end(); //关闭数据库连接
        });
    }

    getTable(tbname) {
        return this.query(`DESC ${tbname}`);
    }

    //查询表主键字段的方法
    async getPK(tbname) {
        let field;
        await this.getTable(tbname).then((result) => {
            result.some((item) => {
                if (item.Key == "PRI") {
                    field = item.Field;
                    return true;
                }
            });
             
        });

        return field;
    }

    //显示mysql执行错误的方法
    errLogs(err) {
        //首先在控制台打印错误
        // console.log(err);
        let {
            errno,
            sqlMessage,
            sql
        } = err;
        
        return {
            message : "！数据库操作失败",
            errno,
            sqlMessage,
            sql,
        }
    }

}

module.exports = Mysql;