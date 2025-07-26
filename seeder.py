const fs = require('fs');

const data = [];
for (let i = 1; i <= 10000; i++) {
  data.push({ name: `User${i}`, age: Math.floor(Math.random() * 60) + 18 });
}

const json = {
  data,
  config: {
    filename: "user_list",
    title: "User List",
    headers: ["name", "age"]
  }
};

fs.writeFileSync("user_list.json", JSON.stringify(json, null, 2));
