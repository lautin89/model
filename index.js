const path = require("path");
const fs = require("fs");
const md5 = require("blueimp-md5");


/**
 * 初始化全局配置
 */
Object.assign(global, {

    __cfg: require("./common/config"),

    ist: {}, //缓存已加载的实例

    get defaults() {
        return this.__cfg;
    },

    set defaults(conn) {
        this.__cfg = conn;
    },

    empty(val) {
        let res;
        switch (typeof val) {
            case "string":
                res = (val == "" || val == "undefined");
                break;
            case "number":
                res = (val == 0);
                break;
            case "object":
                res = Boolean(val == null || Object.values(val).length == 0);
                break;
            case "boolean":
                res = !Boolean(val);
                break;
            default: //其他的值检测
                res = !Boolean(val);
                break;
        }
        return res;
    },

    //递归创建目录 异步方法  
    mkdirs(dirname, callback) {
        fs.exists(dirname, (exists) => {
            if (exists) {
                callback();
            } else {
                mkdirs(path.dirname(dirname), function () {
                    fs.mkdir(dirname, callback);
                });
            }
        });
    },

    //递归创建目录 同步方法  
    mkdirsSync(dirname) {
        //console.log(dirname);  
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    },
    
    /**
     * 从缓存中加载类实例的方法  
     * load("./libs/Model")
     * @param {string} filepath 类文件路径
     * @param {array} args  实例化参数
     * @param {bool} force 是否强制更新
     * @returns {object} 返回类实例
     */
    load(filepath, clsname, args = null, force = false) {
        // if (filepath.endsWith(".js")) {
        //     filepath = filepath.slice(0, -3);
        // }


        // //检测路径是否存在
        // let filename = path.join(filepath, ".js");

        // if (!fs.existsSync(filename)) {
        //     throw new Error(`文件${filename}不存在`);
        // }

        // 提取=模块=名称 ./models/UserModel
        // let clsname = filepath.split(/[\/\\]/).pop();

        //检查是否已有实例化的对象
        if (!global.ist[md5(filepath)] || !force) {

            if (args && args.constructor == Array) { //参数列表被放入数组中
                let comma = "",
                    argStr = "";
                for (let i = 0; i < args.length; i++) {
                    argStr += `${comma} args[${i}]`;
                    comma = ",";
                }
                eval(`global.ist[md5(filepath)] = new clsname(${argStr})`);

            } else {
                global.ist[md5(filepath)] = new clsname;
            }
        }

        return global.ist[md5(filepath)];
    },

    /**
     * 创建model对象并写入表信息 替代表模型
     * @param {string} tableName 要操作的表名
     * @return {object} model 返回表模型对象
     */
    M(tableName = null) {

        const model = load("./libs/Model", require("./libs/Model"));

        //更新模型 写入表基本信息
        if (tableName) {
            let prefix = defaults.prefix || '';
            //手动写入表名和主键
            model.trueName = prefix + tableName;
        }

        return model;

    },

    D(relpath) {

        let fullpath = path.join(defaults.modelPath, relpath);

        try {
            let usrcb = require(fullpath);

            //加载不到模块 则控制台输出错误
            let usrmd = usrcb(require("./libs/Model"));

            //加载指定路径下的类模块
            return load(fullpath, usrmd);


        } catch (e) {

            console.log(e.message);

        }
    }

});

//加载生成模型的指令
require("./make-dir");


module.exports = {

    setConnection(link) {
        if (typeof link != "object") {
            throw new Error("数据库配置必须是对象参数")
        }
        defaults = link;
    },

    getConnection() {
        return defaults;
    },

    //配置模型存放路径
    use(source, target) {
        switch (source.toString()) {
            case "model":
                if (!path.isAbsolute(target)) {
                    throw new Error("模型存放路径必须是绝对地址！");
                }
                defaults.modelPath = target;
                break;

        }
    },
}