const fs = require("fs");
const path = require("path");

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    if (/^make\b/.test(input)) {
        //提取指令 make model Admin/LoginModel
        let [, key, val] = input.split(/\s+/)
        if (key == "model") {

            let fpath, fname;

            if (val.search(/[\\\/]/) > 0) {
                let pos = val.lastIndexOf("/");
                let relPath = val.substr(0, pos);
                fname = val.substr(pos + 1);
                //创建目录
                mkdirsSync(path.join(defaults.modelPath, relPath));
                fpath = path.join(defaults.modelPath, relPath, `${fname}.js`);
            } else {
                fname = val;
                fpath = path.join(defaults.modelPath, `${fname}.js`);
            }

            let content =
`module.exports = function (Model) {

    class ${fname} extends Model {

        constructor() {
    
            //部署表名、前缀和主键
            super({
                tableName: "",
                tablePrefix: "",
                pk : "",
            });
    
        };
    }

    return ${fname};

}`

            fs.writeFileSync(`${fpath}`, content);

            
            rl.close();
        }
    }
});