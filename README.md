
## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

# About modules
| module name | description |
|---|---|
| announcement  |  面向某一group的通知  |
| auth  | 鉴权  |
| chat | 聊天 |
| chatgroup | 聊天组 |
| <del>comment</del> | <del>评论区，已弃用</del>  |
|db|数据库|
|group|用户组|
|internal-message|站内信|
|notification|通知(QQBot, WeChatBot, mailing, internal-message)|
|offline-message|离线消息|
|task-flow|任务流|
|thunder|雷消息（类似DING）|
|user|用户|
|usermeta|用户元数据(目前主要维护在线情况)|

### About Loong message system
#### for online message
可选的E2EE加密，可选的消息分片
密钥协商参见[这里](https://blog.yuzhes.com/posts/xlcomm.html)

#### for offline message
不分片，不能E2EE加密(因为不知道对方的密钥)，但是可以保障消息安全，如果用户启用了RSA加密，就使用用户预留的公钥加密（用户可以自行选择预留密钥）