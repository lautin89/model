/*
 * 数据库模型操作类
 * @version 1.1.1 草案，未完待续，相比较1.1.0做了两处修改：
 *          1)Model.js中的find方法 查询结果为空时 返回null
 *          2)index.js中的empty方法 对于{}、[]和null的判断采用新的比较方式
 * @author lautin
 * @package Mysql
 */

class Model {

    /**
     * @param {object} settings 数据表配置信息
     */
    constructor(settings = {}) {

        //将表信息 写入模型类中
        Object.assign(this, settings);

        //临时属性存储sql各部分的值 用于连贯操作
        this.options = {
            FIELD: "*", //查询字段
            WHERE: "", //查询条件
            ORDER: "", //排序规则
            LIMIT: "", //限制条数
            GROUP: "", //分组
            HAVING: "", //分组条件
        };

        this.row;

        //初始化数据库驱动 并存入全局对象中
        if (!this.db) {
            switch (defaults.type.toLowerCase()) {
                case "mysql":
                    // let Mysql = require("./Mysql");
                    // this.db = new Mysql(defaults);
                    this.db = load("./Mysql", require("./Mysql"), [defaults]);
                    break;
                case "mongo":
                    break;
                case "sqlite":
                    break;
                case "oracle":
                    break;
            }
        }

        //初始化表名
        if (this.tableName && !this.trueName) {
            let prefix = this.tablePrefix || defaults.prefix || "";
            this.trueName = prefix + this.tableName;
        }

        //查询表主键 
        // if (this.tableName && !this.pk) {
        //构造函数不能是异步async
        //     this.pk = await this.db.getPK(this.trueName);
        // }
    }

    data(row) {
        this.row = row;
        return this;
    }

    /*
     * 插入语句 ：INSERT INTO {{tbname}}({{keys}}) VALUES ({{vals}})
     */
    add(args = null) {

        //传入数据对象
        if (!empty(args) && typeof args == "object") {
            this.row = args;
        }

        //提取出字段和值集合
        let keys = Object.keys(this.row).join(",");
        let vals = Object.values(this.row).map((item) => {
            return `'${item}'`;
        }).join(",");

        //解析该条sql语句
        let sql = String.raw `INSERT INTO ${this.trueName}(${keys}) VALUES (${vals})`;

        //将sql写入实例对象中
        this.lastQuery = sql;

        //使用回调函数获取结果
        if (args instanceof Function) {
            this.db.query(sql).then((result) => {
                args(null, result);
            }, (err) => {
                args(err);
            });
        } else {
            //返回一个Promise对象
            return this.db.query(sql);
        }
    }

    /*
     * 修改语句：UPDATE ${tbname} SET ${data} ${WHERE}
     */
    save(args = null) {

        if (!empty(args) && typeof args == "object") {
            let {
                data,
                where
            } = args;

            if (!empty(data)) this.row = data;

            //重置where条件
            if (!empty(where)) this.where(where);

        }

        //组装数据部分
        let records = "",
            comma = "";
        for (let key in this.row) {
            records += `${comma} ${key} = '${this.row[key]}'`;
            comma = ",";
        }

        let sql = String.raw `UPDATE ${this.trueName} SET ${records} ${this.options.WHERE}`;


        if (args instanceof Function) {
            this.db.query(sql).then((result) => {
                args(null, result);
            }, (err) => {
                args(err);
            });
        } else {
            //返回一个Promise对象
            return this.db.query(sql);
        }

    }

    /**
     * 连贯操作 where条件部分的组装 将where条件写入 this.option.WHERE中
     * @param {type} where
     * @returns {nm$_Model.Model}
     */
    where(where) {
        let condition = "";
        if (!empty(where)) {
            if (typeof where == "object") {

                const tmpArr = [];
                /*
                 * ["uid" => 10086]
                 * ["uname" => ["like", "%cc%"]] 表达式查询
                 * ["_logic" => "OR"]            复合查询
                 */
                //默认查询连接条件为AND
                let combine = " AND ";
                for (let [field, value] of Object.entries(where)) {
                    if (field == "_logic") {
                        //重置逻辑运算符
                        combine = ` ${value} `;
                        //跳过本次==运行
                        continue;
                    }
                    //如果字段值为数组 则表示有特殊条件
                    if (value.constructor == Array) {
                        //提取表达式和值
                        let [exp, rule] = value;
                        switch (exp) {
                            case "in":
                            case "not in":
                                tmpArr.push(`${field} ${exp} (${rule})`);
                                break;
                            case "between":
                                let [start, end] = rule.split(","); //between 5, 10
                                tmpArr.push(`${field} BETWEEN ${start} AND ${end}`);
                                break;
                            default:
                                tmpArr.push(`${field} ${exp} '${rule}'`);
                                break;
                        }
                    } else {
                        tmpArr.push(`${field} = '${value}'`);
                    }
                }
                condition = ' WHERE ' + tmpArr.join(combine);
            } else {
                condition = ' WHERE ' + where;
            }
        }

        //写入where条件
        this.options.WHERE = condition;

        return this;
    }

    /*
     * 查询语句：SELECT %FIELDS% FROM %TBNAME% %WHERE% %LIMIT% %ORDER%
     */
    select( /*where = "", order = "", limit = "", fields = "*"*/ args = null) {

        if (!empty(args) && typeof args == "object") {

            let {
                where,
                order,
                limit,
                fields
            } = args;

            //重组 where、 order 和 limit
            if (!empty(fields)) this.field(fields);

            if (!empty(where)) this.where(where);

            if (!empty(order)) this.order(order);

            if (!empty(limit)) this.limit(limit);

        }


        //设置sql语句
        let sql = String.raw `SELECT ${this.options.FIELD} FROM ${this.trueName} ${this.options.WHERE} ${this.options.ORDER} ${this.options.LIMIT}`;


        if (args instanceof Function) {
            this.db.query(sql).then((result) => {
                args(null, result);
            }, (err) => {
                args(err);
            });
        } else {
            //返回一个Promise对象
            return this.db.query(sql);
        }

    }

    field(fields = null) {
        if (!empty(fields)) {
            this.options.FIELD = fields;
        }
        return this;
    }

    order(order) {
        if (!empty(order)) {
            this.options.ORDER = ` ORDER BY ${order}`;
        }
        return this;
    }

    limit(start, length = null) {
        if (!empty(start) || start == 0) {
            if (!empty(length)) { //重组为 "5, 12" 或者"5"
                this.limit(`${start}, ${length}`);
            } else {
                this.options.LIMIT = ` LIMIT ${start} `;
            }
        }
        return this;
    }

    //计算结果集的数量
    async count(field = null, where = null) {
        if (!empty(field)) this.field(field);
        if (!empty(where)) this.where(where);

        let sql = String.raw `SELECT COUNT(${this.options.FIELD}) FROM ${this.trueName} ${this.options.WHERE}`;

        let RowDataPacket =  await this.db.query(sql);
        
        return RowDataPacket[0]['COUNT(' + this.options.FIELD + ')'];

    }

    async find( /*where = "", order = "", fields = "*"*/ args = null) {

        let where, order, fields;

        if (!empty(args) && typeof args == "object") {

            ({
                where,
                order,
                fields
            } = args);

        }

        if (args instanceof Function) {
            this.select({
                where,
                order,
                limit: 1,
                fields
            }).then((result) => {
                const row = result.length ? result[0] : null;
                args(null, row);
            }, (err) => {
                args(err);
            })

        } else {
            const RowDataPacket = await this.select({
                where,
                order,
                limit: 1,
                fields
            });

            //查找不到  转化为空字符串结果
            return RowDataPacket.length ? RowDataPacket[0] : null;
        }


    }

    async delete(mixed = null) {

        if (!empty(mixed)) {
            if (typeof mixed == "number") {
                this.pk = await this.db.getPK(this.trueName);
                this.where(`${this.pk} = ${mixed}`);
            } else {
                this.where(mixed);
            }
        }

        let sql = String.raw `DELETE FROM ${this.trueName} ${this.options.WHERE}`;

        if (mixed instanceof Function) {
            this.db.query(sql).then((result) => {
                mixed(null, result);
            }, (err) => {
                mixed(err);
            });
            //相当于Promise.resolve("")
            return ""; //
        } else {
            //返回一个真实的Promise对象
            return this.db.query(sql);
        }
    }

    //空模型方法 用来运行sql指令
    runSql(sql, callback = null) {
        if (callback instanceof Function) {
            this.db.query(sql).then((result) => {
                callback(null, result);
            }, (err) => {
                callback(err);
            });
        } else {
            return this.db.query(sql);
        }

    }
}

module.exports = Model;