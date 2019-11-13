### 下载安装

- `npm install lautin-model`
- 配置数据库连接：

```javascript
const db = require("lautin-model");
db.setConnection({
    type : "mysql",	//加载的驱动
    host : "localhost",	//数据库地址
    user : "root",	//账号
    password : "",	//密码
    database : "test",	//选择数据库
});	//配置数据库连接信息
```

- 全局封装的 `M(表名)方法 ` 进行数据操作

```javascript
M("users").find((err, result) => {
    if (err) console.log(err);
    else console.log(result);
});
```



### 基本CURD

- add方法添加一条记录

  - 用法：`M(表名).add(数据).then(resolve, reject)`
  - 示例：

  ```javascript
  const pms = M("users").add({
      uname : "熏凯旋",
      nickname : "孙行者",
      password : md5('123456'),	//md5包需要额外安装
  });	//数据操作结果为一个正在进行的Promise
      //使用then来接收完成时的结果或错误
  pms.then((result) => {
      //增删改返回OkPacket对象 查询返回RowDataPacket集合
      console.log(result);
  }, (err) => {
      //err对象中 包含sql语句，sql错误提示以及mysql错误号
      console.log(err);
  })
  ```

- save方法修改表记录

  - 用法：`M(表名).save({新数据, 条件}).then(resolve, reject)`
  - 示例：

  ```javascript
  //修改编号100的用户昵称为foo
  M("users").save({
      data : {
          nickname : "foo",
      },
      //where条件即可以是字符串('uid=100') 也可以是对象形式
      where : {
          uid : 100
      },
  }).then((result) => {}, (err) => {});
  ```

- delete删除记录

  - 用法：`M(表名).delete(条件).then(resolve, reject)`
  - 示例：

  ```javascript
  //删除编号为100的用户记录
  M("users").delete({uid : 100}).then((result) => {}, (err) => {});
  //还可以直接传入一个数值 表示删除主键编号为该值的一条记录
  M("user").delete(100).then((result) => {}, (err) => {})
  ```

- select查询多条记录

  - 用法：`M(表名).select({字段列表, 条件, 排序规则, 限制行数}).then(resolve, reject)`
  - 示例：

  ```javascript
  //查询最新上架的笔记本 只显示10条
  M("goods").select({
      where : {gname : ["LIKE", "%笔记本%"]},	// `gname` LIKE '%笔记本%'
      order : "created DESC",
      limit : 10,
  }).then((result) => {
      //result返回对象集合数组 即使只有查询结果[{}]
      console.log(result);
  }, (err) => {})
  ```

- find查找一条结果

  - 用法：`M(表名).find({字段列表, 条件, 排序规则}).then(resolve, reject)`
  - 示例：

  ```javascript
  //查找账号为lautin 或者 邮箱为1538731090@qq.com的用户
  M("users").find({
    where : {
        uname : "lautin",
        email : "1538731090@qq.com",
        _logic : "OR"
    },		
  }).then((result) => {
      //返回一个数据对象 不是集合形式
      console.log(result);
  }, (err) => {});
  ```

  

### 链式操作

上述方法，除了在方法体内一次性传参外，还可以使用链式调用 分别设置参数：

- data()方法：创建数据，传入一个数据对象
- where()方法：设置条件，支持字符串和对象两种形式，参数格式如下：
  - `'id = 100' `等等其它运算符表达式
  - `{uname : 'foo',  password : 'bar' }`  多个条件默认AND连接
  - `{uname : 'lautin',  email : '1538731090@qq.com',  _logic:'OR' } ` 设置OR连接
  - `{uname :  ['LIKE', '%abc%'] }`   模糊查询
  - `{id : ['IN' , '1,3,5' ] } ` 编号为1,3,5的记录
  - `{id : [' NOT IN', '2,4,6'] }` 编号2,4,6以外的记录
  - `{id : ['BETWEEN', '10, 20'] } `编号10到20之间的记录
- order()方法：设置排序规则，传入字符串 例如： `uid DESC`
- limit()方法：限制行数，传入数值或者字符串，例如：`5` 或者 `'0, 5'`

链式操作中，可以结合实际情况 选择上述方法。链式方法在调用时 **无需考虑它们的顺序**  ==但必须以curd的调用方法结束==，此时curd方法中 无需再传入sql分段参数。

```javascript
const pms = M("users").data({}).add();
//const pms = M("users").data().where().save();
//const pms = M("users").where().delete();
//const pms = M("users").where().order().limit().select();
//const pms = M("users").where().order().find();

//再监听pms
pms.then(resolve, reject);
```



### 回调函数

在链式操作中，curd方法 无需再传入sql参数，接下来使用then方法接收Promise决议结果。处理Promise外，链式操作的curd方法中 还可以直接传入一个回调函数来接收结果：

```javascript
M("users").where().order().select((err, result) => {
    if (err) console.log(err);
    else console.log(result);
});//使用回调函数后 无需再then，其他操作方法同样使用
```



### 高级应用

- 手写sql语句：

对于复杂的业务处理时，往往需要使用高级sql语句。例如：联合查询、交叉连接、事务和存储过程等。这样curd方法自然无法满足需求，但内置的runSql()可以接收一条sql语句 来定制实际需求。

```javascript
//执行sql指令时 设置空模型即可
M().runSql(sql, (err, result) => {
    
});
```



- 自定义表模型：

如果想要定制自己的模型方法，可以通过创建表模型类来完成。该模型需要继承核心的Model类，在使用前需要配置模型存放的根路径，该路径必须是一个**绝对地址**：

```javascript
const path = require("path");
//使用path.resolve()方法 转化绝对路径
db.use("model", path.resolve("./models"));
```

```javascript
//文件名必须和模型类名称保持一致，例如 ~/models/CateModel.js
module.exports = function (Model) {

    class CateModel extends Model {

        constructor() {
    
            //部署表名、前缀和主键
            super({
                tableName: "category",
                tablePrefix: "shop_",
                pk : "cid",
            });
    		
            getNameById(cid) {
                //to do here
                
            }
        };

         
    }

    return CateModel;

}
```

对于自定义的表模型需要严格按照上述规范来定义，你也可以在命令行使用`make model CateModel`来帮你快速生成。当创建好模型后，使用D(类名) 创建它的示例：

```javascript
D("CateModel").getNameById(100);
```

