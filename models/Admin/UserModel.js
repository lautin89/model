module.exports = function (Model) {

    class UserModel extends Model {

        constructor() {
    
            //部署表名、前缀和主键
            super({
                tableName: "users",
                tablePrefix: "shop_",
                pk : "uid",
            });
    
        };
    }

    return UserModel;

}