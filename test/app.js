const db = require("../index");

db.setConnection({
    type: "mysql",
    host: "localhost",
    user: "root",
    password: "",
    database: "shop",
    prefix: "shop_",
});

const path = require("path");

//配置模型存放路径
db.use("model", path.resolve("../models"));

console.log(M("goods").find());

// 修改记录
// M("users").where("uid = 101").data({password : "abcdefg"}).save({
//     where : "uid = 111",
//     data : {password : "hijklmn"}
// }).then((result) => {
//     console.log(result);
// }, (err) => {
//     console.log(err);
// })

// 添加记录
// M("users").data({
//     uname : 'buan2',
//     password : 'bunanna',
// }).add().then((result) => {
//     console.log(result);
// }, (err) => {
//     console.log(err);
// })

// 删除记录
// M("users").delete(100).then((result) => {
//     console.log(result);
// }, (err) => {
//     console.log(err);
// })

// 加载 ./models/Admin/UserModel
D("Admin/UserModel").field("uid, uname").find().then((result) => {
    console.log(result);
});

// M().runSql("SELECT * FROM shop_users LIMIT 2", (err, data) => {
//     console.log(data);
// });


// db.use("./models/UserModel").find(() => {

// }).then(() => {

// })

// const userModel = require()
// db.use().find().then(() => {

// });