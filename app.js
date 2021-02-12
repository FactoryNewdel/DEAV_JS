const express = require('express')
const path = require('path')
let app = express()
let fs = require('fs')
const bodyParser = require('body-parser');
const {exec, execSync} = require("child_process")
let consolidate = require('consolidate')
let multer = require('multer');
let upload = multer({dest: 'upload/'});


app.engine('html', consolidate.mustache)
app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'styles')))
//app.use(express.urlencoded({extended:true}))
app.use('/scripts/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist/')));
app.use('/scripts/jquerydrag', express.static(path.join(__dirname, '/node_modules/jquery.event.drag/')));
app.use('/scripts/slickgrid', express.static(path.join(__dirname, '/node_modules/slickgrid/')));
app.use('/scripts/chart', express.static(path.join(__dirname, '/node_modules/chart.js/dist')));
app.use('/scripts/chartzoom', express.static(path.join(__dirname, '/node_modules/chartjs-plugin-zoom/dist')));
app.use('/scripts/hammer', express.static(path.join(__dirname, '/node_modules/hammerjs')));
app.use('/uploads', express.static(path.join(__dirname, 'upload')))
app.set('views', path.join(__dirname, 'views'))
app.set('public', path.join(__dirname, 'public'))
app.set('TRA', path.join(__dirname, 'TRA'))
//app.set('public', path.join(__dirname, 'public'))
app.set('view engine', 'html')

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/index.html'))
})

app.get('/lelele', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/lelele.html'))
})

app.post('/combine', function (req, res) {
    console.log('combine = ' + JSON.stringify(req.body))
})

app.post('/upload', upload.array('files', 10), function (req, res) {
    /*console.log('up = ' + JSON.stringify(req.body))
    console.log('upup = ' + req.body.data)
    //console.log('upupup = ' + req.body)
    console.log('upupupup = ' + req.files)
    console.log('upupupupup = ' + req.file)
    console.log('upupupupupup = ' + JSON.stringify(req.file))
    console.log('upupupupupupup = ' + JSON.stringify(req.file))*/
    let files = req.files
    console.log('files = ' + JSON.stringify(req.files))
    let newPaths = []
    let toDelete = []
    for (let i = 0; i < files.length; i++) {
        newPaths.push(__dirname + '/' + files[i].destination + files[i].originalname)
        fs.renameSync(__dirname + '/' + files[i].path, newPaths[i])
    }
    let url = ""
    for (let i = 0; i < newPaths.length; i++) {
        url += newPaths[i] + ';'
        try {
            fs.accessSync(newPaths[i] + '.DAT')
            try {
                fs.unlinkSync(newPaths[i])
            } catch (err) {
                if (err) {
                    console.log(err)
                    return
                }
            }
        } catch (err) {
            toDelete.push(newPaths[i])
            console.log('path = ' + newPaths[i])
        }
    }
    url = url.substr(0, url.length - 1)

    if (toDelete.length !== 0) {
        let all = ""
        for (let i = 0; i < toDelete.length; i++) {
            all += toDelete[i] + '?'
            console.log('toDelete = ' + toDelete[i])
        }
        all = all.substr(0, all.length - 1)

        try {
            execSync("java -jar /root/NodeJS/DEAV/Excel.main.jar -d " + all, {maxBuffer: 1024 * 1024 * all.length})
        } catch (err) {
            console.log('execErr = ' + err)
            return
        }
    }

    for (let i = 0; i < toDelete.length; i++) {
        try {
            console.log('unlinking: ' + toDelete[i])
            fs.unlinkSync(toDelete[i])
            console.log('unlinked')
        } catch (err) {
            if (err) {
                console.log(err)
                return
            }
        }
    }
    res.redirect('/overview?path=' + url)
})

app.get('/download/:filename', function (req, res) {
    if (!req.params.filename.endsWith('.DAT')) return
    let fullPath = __dirname + '/upload/' + req.params.filename
    console.log("java -jar /root/NodeJS/DEAV/Excel.main.jar -e " + fullPath)
    exec("java -jar /root/NodeJS/DEAV/Excel.main.jar -e " + fullPath, {maxBuffer: 1024 * 1024}, (error, stdout, stderr) => {
        if (error) {
            console.log(`error3: ${error.message}`);
            console.log(`error3: ${error.status}`);
            return
        }
        if (stderr) {
            console.log(`stderr3: ${stderr}`);
            return;
        }
        res.download(fullPath + '.xlsx')
    })
})

app.get('/overview', function (req, res) {
    console.log('path = ' + req.query.path)

    let paths = req.query.path.replace('\"', '').split(';')
    fs.readFile((paths[0] + '.DAT'), function (err, data) {
        if (err) {
            console.log('err = ' + err)
            return
        }
        //console.log('data = ' + data)
        let json
        try {
            JSON.parse(data.toString())
        } catch (err) {
            console.log('jsonErr = ' + err)
            //res.redirect('/overview?path=' + req.query.path)
            return
        }
        res.sendFile(path.join(__dirname + '/views/Overview.html'))
    });
    //res.render('Overview.html', {data: 187})
})


app.get('list', function (req, res) {
    fs.readdir('ERG', (err, files) => {
        files.forEach(file => {
            console.log(file);
        });
    });
    fs.readdir('TRA', (err, files) => {
        files.forEach(file => {
            res.send(file)
            console.log(file);
        });
    });
})

app.listen(1338, function () {
    console.log('Jey, es funktioniert')
});