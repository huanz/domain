const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const pLimit = require('p-limit');

class DomanSearch {
    constructor(words, suffix = 'com') {
        this.words = words;
        this.suffix = suffix;
        this.domains();
    }
    domains() {
        let domainList = [];
        readline.createInterface({
            input: fs.createReadStream(`words/${this.words}.txt`)
        }).on('line', (line) => {
            domainList.push(`${line}.${this.suffix}`);
        }).on('close', async () => {
            const limit = pLimit(1);
            const result = await Promise.all(domainList.map((domain) => limit(() => this.check(domain))));
            console.log('检索完成');
        })
    }
    check(domain) {
        return axios.get(`http://panda.www.net.cn/cgi-bin/check.cgi?area_domain=${domain}`).then(res => {
            const original = res.data.match(/<original>([\S\s]+)<\/original>/);
            if (original && original[1]) {
                const code = original[1].split(' : ')[0];
                switch(code) {
                    case '210':
                        console.log(`\u001b[32m${domain}: 可以注册\u001b[39m`);
                        this.store(domain);
                        break;
                    case '213':
                        console.log(`\u001b[31m${domain}: 查询超时\u001b[39m`);
                        break;
                    case '211':
                        console.log(`\u001b[33m${domain}: 已经注册\u001b[39m`);
                        break;
                    default:
                        console.log(`\u001b[31m${domain}: 未知问题\u001b[39m`);
                        break;
                }
                return code;
            } else {
                console.log(`\u001b[31m${domain}: 查询失败\u001b[39m`);
            }
        })
    }
    store(domain) {
        return fs.appendFileSync(`output/${this.suffix}_${this.words}.txt`, `${domain}\n`);
    }
}

new DomanSearch('common', 'me');