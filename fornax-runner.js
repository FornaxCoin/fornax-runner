const fs = require('fs')
const {networkInterfaces} = require('os');
const nets = networkInterfaces();
const readline = require('node:readline');
const {exec} = require("child_process");
const {stdin: input, stdout: output} = require('node:process');
const rl = readline.createInterface({input, output, prompt: 'OHAI> '});
let config = null;
let message;

async function readConfig() {
    config = fs.readFileSync('config.json', "utf-8");
    config = JSON.parse(config)
}
async function saveConfig() {
    fs.writeFileSync('config.json', JSON.stringify(config), "utf-8");
}

async function exists(name) {
    return new Promise((resolve) => {
        exec("test -e " + name + " && echo true || echo false ", (error, stdout, stderr) => {
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(stdout.trim());
        });
    })
}
async function mkdir(name) {
    return new Promise((resolve) => {
        exec("mkdir " + name, (error, stdout, stderr) => {
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(true);
        });
    })
}
async function mkdirfull(path) {
    let dirs = path.split('/')
    console.log(dirs);
    let preDir = '';
    for (let i = 0; i < dirs.length; i++) {
        if (dirs[i] !== '~') {
            console.log('making dir:', preDir + dirs[i])

            let res = await mkdir(preDir + dirs[i]);
            console.log('res', res)
        }
        preDir = preDir + dirs[i] + '/'
    }
}
async function chmod(path, permission) {
    return new Promise((resolve) => {
        exec("chmod " + permission + " " + path, (error, stdout, stderr) => {
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(true);
        });
    })
}
async function cp(src, dest) {
    return new Promise((resolve) => {
        exec("cp " + src + " " + dest, (error, stdout, stderr) => {
            console.log('copying', src)
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(true);
        });
    })
}
async function cpDir(src, dest) {
    return new Promise((resolve) => {
        exec("cp -R " + src + " " + dest, (error, stdout, stderr) => {
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(true);
        });
    })
}
async function ls(src, dest) {
    exec("ls", (error, stdout, stderr) => {
        if (error) {
            message = error.message
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}
async function deleteDir(path) {
    return new Promise((resolve) => {
        exec("rm -rf " + path, (error, stdout, stderr) => {
            if (error) {
                resolve(error.message)
            }
            if (stderr) {
                resolve(stderr);
            }
            resolve(true);
        });
    })
}
async function cin(question = '') {
    return new Promise((resolve, reject) => {
        rl.question(question, name => {
            console.log('input =>', name);
            resolve(name)
        });
    });
}

async function runGethWithScreen( command, path = '~/fornax/geth/', screenName = 'fornax'){
    if(path==='default'){
        path = '~/fornax/geth/'
    }
    return new Promise((resolve) => {
        let cmd = 'screen -S '+screenName+' -m -- sh -c \''+ path + './' + command+'\''
        console.log("Enter this command in terminal ==> ", cmd)
        cmd = 'open -a terminal'
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(error.message)
                resolve(error.message)
            }
            if (stderr) {
                console.log(stderr)
                resolve(stderr);
            }
            console.log(stdout)
            resolve(true);
        });
    })
}
async function runGeth(command, path = '~/fornax/geth/') {
    if (screen) {
        // return new Promise((resolve) => {
        //     exec('screen -S hello -p 0 -X stuff "echo hello' + path + './' + command, (error, stdout, stderr) => {
        //         if (error) {
        //             console.error(error.message)
        //             resolve(error.message)
        //         }
        //         if (stderr) {
        //             console.log(stderr)
        //             resolve(stderr);
        //         }
        //         console.log(stdout)
        //         resolve(true);
        //     });
        // })
    } else {
        return new Promise((resolve) => {
            exec("" + path + "./" + command, (error, stdout, stderr) => {
                if (error) {
                    console.error(error.message)
                    resolve(error.message)
                }
                if (stderr) {
                    console.log(stderr)
                    resolve(stderr);
                }
                console.log(stdout)
                resolve(true);
            });
        })
    }
}





// Miner Node Functions
async function minernode() {
    console.log('You selected Miner Node')
    console.log("1 => Configure Miner Node")
    console.log("2 => Init Miner Node")
    console.log("3 => Start Miner Node")
    console.log("4 => Delete Miner Node (if any)")
    console.log("0 => Main menu")
    let opt = await cin('select any number:');
    switch (opt) {
        case '1': {
            await minernodeConfig();
            await minernode();
            break;
        }
        case '2': {
            await minernodeInit();
            await minernode();
            break;
        }
        case '3': {
            await minernodeStart();
            break;
        }
        case '4': {
            await minernodeDelete();
            break;
        }
        case '0': {
            await main();
            break;
        }
        default : {
            await minernode();
            break
        }

    }
}
async function minernodeConfig() {
    console.log('Configure Miner Node')
    let ip = await cin('Enter IP:');
    let net = await cin('Enter network address:');
    let port = await cin('Enter port (default 30303):');
    port = port?port:'30303'
    let httpPort = await cin('Enter http port (default 18545):');
    httpPort = httpPort?httpPort:'18545'
    let wsPort = await cin('Enter ws port (default 18546):');
    wsPort = wsPort?wsPort:'18546'
    let bootnodeEnode = await cin('Enter Bootnode Enode:');
    bootnodeEnode = bootnodeEnode?'--bootnodes '+bootnodeEnode:''
    const minernodeInit = 'geth --nat extip:'+ip+' --netrestrict '+net+' --identity "fornax" '+bootnodeEnode+' --syncmode full --http.vhosts "*" --http --http.addr '+ip+' --http.port '+httpPort+' --http.corsdomain "*" --http.api miner,txpool,admin,eth,net,web3,personal,debug --ws --ws.addr '+ip+' --ws.port '+wsPort+' --ws.origins "*" --ws.api miner,txpool,admin,eth,net,web3,personal,debug --graphql --graphql.corsdomain "*" --datadir ~/fornax/minernode/data --port '+port+' --networkid 13936 init ~/fornax/Genesis.json'
    const minernodeStart = 'geth --nat extip:'+ip+' --netrestrict '+net+' --networkid 13936 --identity "fornax" '+bootnodeEnode+' --syncmode full --http.vhosts "*" --http --http.addr '+ip+' --http.port '+httpPort+' --http.corsdomain "*" --http.api miner,txpool,admin,eth,net,web3,personal,debug --ws --ws.addr '+ip+' --ws.port '+wsPort+' --ws.origins "*" --ws.api miner,txpool,admin,eth,net,web3,personal,debug --graphql --graphql.corsdomain "*" --datadir ~/fornax/minernode/data --port '+port+' console 2>> ~/fornax/minernode/fornax.log'
    const minernode = {
        ip,
        net,
        port,
        httpPort,
        wsPort,
        minernodeInit,
        minernodeStart
    }
    config['minernode'] = minernode;
    await saveConfig();

}
async function minernodeInit() {
    console.log('Init Miner Node')
    if (config.minernode && config.minernode.minernodeInit) {
        console.log(config.minernode)
        let opt = await cin('Init with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Initializing')
                let ifExists = exists('~/fornax/minernode')
                if (ifExists === 'true') {
                    console.log('Miner Node directory already exists')
                } else {
                    await mkdirfull('~/fornax/minernode/data')
                    await chmod('~/fornax/minernode', '777')
                    await runGeth(config.minernode.minernodeInit)
                }
                break;
            }
            case 'n': {
                await minernodeConfig();
                break;
            }
            default: {
                await minernode();
            }
        }
    }
}
async function minernodeStart() {
    console.log('Start Miner Node')
    if (config.minernode) {
        console.log(config.minernode)
        let opt = await cin('Run with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Starting')
                let ifExists = exists('~/fornax/minernode/data')
                if (!ifExists === 'true') {
                    console.log('Miner Node directory doesnt exists. Create form Miner Node configuration.')
                } else {
                    await runGethWithScreen(config.minernode.minernodeStart,'default','minernode')
                }
                break;
            }
            case 'n': {
                await minernodeConfig();
                break;
            }
            default: {
                await minernode();
            }
        }
    }
}
async function minernodeDelete() {
    console.log('Delete Miner Node')
    let opt = await cin('Are you sure you want to delete? (y/n):');
    switch (opt) {
        case 'y': {
            await deleteDir('~/fornax/minernode')
            await minernode()
            break;
        }
        default : {
            await minernode();
            break
        }

    }
}


// Boot Node Functions
async function bootnode() {
    console.log('You selected Boot Node')
    console.log("1 => Configure Boot Node")
    console.log("2 => Init Boot Node")
    console.log("3 => Start Boot Node")
    console.log("4 => Delete Boot Node (if any)")
    console.log("0 => Main menu")
    let opt = await cin('select any number:');
    switch (opt) {
        case '1': {
            await bootnodeConfig();
            await bootnode();
            break;
        }
        case '2': {
            await bootnodeInit();
            await bootnode();
            break;
        }
        case '3': {
            await bootnodeStart();
            break;
        }
        case '4': {
            await bootnodeDelete();
            break;
        }
        case '0': {
            await main();
            break;
        }
        default : {
            await bootnode();
            break
        }

    }
}
async function bootnodeConfig() {
    console.log('Configure Boot Node')
    let ip = await cin('Enter IP:');
    let net = await cin('Enter network address:');
    let port = await cin('Enter port (default 30303):');
    port = port?port:'30303'
    let httpPort = await cin('Enter http port (default 18545):');
    httpPort = httpPort?httpPort:'18545'
    const bootnodeInit = 'geth --nat extip:' + ip + ' --netrestrict ' + net + ' --identity "fornax"  --networkid 13936 --syncmode full --http.vhosts "*" --http --http.addr ' + ip + ' --http.port ' + httpPort + ' --http.corsdomain "*" --http.api admin,eth,net,web3 --datadir ~/fornax/bootnode/data --port ' + port + ' init ~/fornax/Genesis.json'
    const bootnodeStart = 'geth --nat extip:' + ip + ' --netrestrict ' + net + ' --identity "fornax" --networkid 13936 --syncmode full --rpcvhosts "*" --http --http.addr ' + ip + ' --http.port ' + httpPort + ' --http.corsdomain "*" --http.api admin,eth,net,web3 --datadir ~/fornax/bootnode/data --port ' + port + ' console 2>> ~/fornax/bootnode/fornax.log'
    const bootnode = {
        ip,
        net,
        port,
        httpPort,
        bootnodeInit,
        bootnodeStart
    }
    config['bootnode'] = bootnode;
    await saveConfig();
}
async function bootnodeInit() {
    console.log('Init Boot Node')
    if (config.bootnode && config.bootnode.bootnodeInit) {
        console.log(config.bootnode)
        let opt = await cin('Init with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Initializing')
                let ifExists = exists('~/fornax/bootnode')
                if (ifExists === 'true') {
                    console.log('Bootnode directory already exists')
                } else {
                    await mkdirfull('~/fornax/bootnode/data')
                    await chmod('~/fornax/bootnode', '777')
                    await runGeth(config.bootnode.bootnodeInit)
                }
                break;
            }
            case 'n': {
                await bootnodeConfig();
                break;
            }
            default: {
                await bootnode();
            }
        }
    }
}
async function bootnodeStart() {
    console.log('Start Boot Node')
    if (config.bootnode) {
        console.log(config.bootnode)
        let opt = await cin('Run with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Starting')
                let ifExists = exists('~/fornax/bootnode/data')
                if (!ifExists === 'true') {
                    console.log('Bootnode directory doesnt exists. Create form Bootnode configuration.')
                } else {
                    await runGethWithScreen(config.bootnode.bootnodeStart,'default','bootnode')
                }
                break;
            }
            case 'n': {
                await bootnodeConfig();
                break;
            }
            default: {
                await bootnode();
            }
        }
    }
}
async function bootnodeDelete() {
    console.log('Delete Boot Node')
    let opt = await cin('Are you sure you want to delete? (y/n):');
    switch (opt) {
        case 'y': {
            await deleteDir('~/fornax/bootnode')
            await bootnode()
            break;
        }
        default : {
            await bootnode();
            break
        }

    }
}

// Public Node Functions
async function publicnode() {
    console.log('You selected Public Node')
    console.log("1 => Configure Public Node")
    console.log("2 => Init Public Node")
    console.log("3 => Start Public Node")
    console.log("4 => Delete Public Node (if any)")
    console.log("0 => Main menu")
    let opt = await cin('select any number:');
    switch (opt) {
        case '1': {
            await publicnodeConfig();
            await publicnode();
            break;
        }
        case '2': {
            await publicnodeInit();
            await publicnode();
            break;
        }
        case '3': {
            await publicnodeStart();
            break;
        }
        case '4': {
            await publicnodeDelete();
            break;
        }
        case '0': {
            await main();
            break;
        }
        default : {
            await publicnode();
            break
        }

    }
}
async function publicnodeConfig() {
    console.log('Configure Public Node')
    let ip = await cin('Enter IP:');
    let net = await cin('Enter network address:');
    let port = await cin('Enter port (default 30303):');
    port = port?port:'30303'
    let httpPort = await cin('Enter http port (default 18545):');
    httpPort = httpPort?httpPort:'18545'
    let wsPort = await cin('Enter ws port (default 18546):');
    wsPort = wsPort?wsPort:'18546'
    let bootnodeEnode = await cin('Enter Bootnode Enode:');
    bootnodeEnode = bootnodeEnode?'--bootnodes '+bootnodeEnode:''
    const publicnodeInit = 'geth --nat extip:'+ip+' --netrestrict '+net+' --identity "fornax" '+bootnodeEnode+' --syncmode full --http.vhosts "*" --http --http.addr '+ip+' --http.port '+httpPort+' --http.corsdomain "*" --http.api eth,net,web3,debug --ws --ws.addr '+ip+' --ws.port '+wsPort+' --ws.origins "*" --ws.api eth,net,web3,debug --graphql --graphql.corsdomain "*" --vmdebug --datadir ~/fornax/publicnode/data --port '+port+' --networkid 13936 init ~/fornax/Genesis.json'
    const publicnodeStart = 'geth --nat extip:'+ip+' --netrestrict '+net+' --networkid 13936 --identity "fornax" '+bootnodeEnode+' --syncmode full --http.vhosts "*" --http --http.addr '+ip+' --http.port '+httpPort+' --http.corsdomain "*" --http.api eth,net,web3 --ws --ws.addr '+ip+' --ws.port '+wsPort+' --ws.origins "*" --ws.api eth,net,web3 --graphql --graphql.corsdomain "*" --datadir ~/fornax/publicnode/data --port '+port+' console 2>> ~/fornax/publicnode/fornax.log'
    const publicnode = {
        ip,
        net,
        port,
        httpPort,
        publicnodeInit,
        publicnodeStart
    }
    config['publicnode'] = publicnode;
    await saveConfig();
}
async function publicnodeInit() {
    console.log('Init Public Node')
    if (config.publicnode && config.publicnode.publicnodeInit) {
        console.log(config.publicnode)
        let opt = await cin('Init with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Initializing')
                let ifExists = exists('~/fornax/publicnode')
                if (ifExists === 'true') {
                    console.log('Public Node directory already exists')
                } else {
                    await mkdirfull('~/fornax/publicnode/data')
                    await chmod('~/fornax/publicnode', '777')
                    await runGeth(config.publicnode.publicnodeInit)
                }
                break;
            }
            case 'n': {
                await publicnodeConfig();
                break;
            }
            default: {
                await publicnode();
            }
        }
    }
}
async function publicnodeStart() {
    console.log('Start Public Node')
    if (config.publicnode) {
        console.log(config.publicnode)
        let opt = await cin('Run with this configuration? (y/n)');
        switch (opt) {
            case 'y': {
                console.log('Starting')
                let ifExists = exists('~/fornax/publicnode/data')
                if (!ifExists === 'true') {
                    console.log('Public Node directory doesnt exists. Create form Public Node configuration.')
                } else {
                    await runGethWithScreen(config.minernode.minernodeStart,'default','publicnode')
                }
                break;
            }
            case 'n': {
                await publicnodeConfig();
                break;
            }
            default: {
                await publicnode();
            }
        }
    }
}
async function publicnodeDelete() {
    console.log('Delete Public Node')
    let opt = await cin('Are you sure you want to delete? (y/n):');
    switch (opt) {
        case 'y': {
            await deleteDir('~/fornax/publicnode')
            await publicnode()
            break;
        }
        default : {
            await publicnode();
            break
        }

    }
}


async function main() {
    console.log("1 => Boot Node")
    console.log("2 => Miner Node")
    console.log("3 => Public Node")
    console.log("4 => Set Geth Directory")
    let opt = await cin('select any number:');
    console.log(opt)
    switch (opt) {
        case '1': {
            await bootnode();
            break;
        }
        case '2': {
            await minernode()
            break;
        }
        case '3': {
            await publicnode()
            break;
        }
        case '4': {

            let doesExists = await exists('~/fornax/geth')
            if (doesExists === 'true') {
                console.log('Geth arleady exists');
            } else {
                let res = await mkdirfull('~/fornax/geth');
                res = await chmod('~/fornax', "777")
                res = await cpDir('geth', '~/fornax')
                await cp('Genesis.json', '~/fornax/Genesis.json')
            }
            await main()
            break;
        }
        default: {
            await main()
            break
        }
    }
}

(async () => {
    await readConfig();
    await main()
})()
