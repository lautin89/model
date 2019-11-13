//数据库配置文件
module.exports = {
    type : "mysql",     //加载的驱动
    host : "localhost", //服务器地址
    user : "root",  //连接账号
    password: "",   //账号密码
    database: "test",   //选择数据库
    prefix : "",        //默认表前缀，例如 "sys_"
}