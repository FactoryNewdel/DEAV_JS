$(document).ready(function () {
    console.log("--------------------")
    let fileData = [];
    let fileColumns = [];

    let chart;
    let slickgrid;
    let avgGrid;
    let susChart;

    const resizer = document.getElementById('dragMe');
    const leftSide = document.getElementById('leftDiv')
    const rightSide = document.getElementById('rightDiv')

    // The current position of mouse
    let x = 0;
    let y = 0;
    let leftWidth = 0;
    let rightWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e) {
        // Get the current mouse position
        x = e.clientX;
        y = e.clientY;
        leftWidth = leftSide.getBoundingClientRect().width;
        rightWidth = rightSide.getBoundingClientRect().width;

        // Attach the listeners to `document`
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        // How far the mouse has been moved
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newLeftWidth = (leftWidth + dx) * 100 / resizer.parentNode.getBoundingClientRect().width;
        const newRightWidth = (rightWidth - dx) * 100 / resizer.parentNode.getBoundingClientRect().width;

        leftSide.style.width = `${newLeftWidth}%`;
        rightSide.style.width = `${newRightWidth}%`;

        resizer.style.cursor = 'col-resize';
        document.body.style.cursor = 'col-resize';

        leftSide.style.userSelect = 'none';
        leftSide.style.pointerEvents = 'none';

        rightSide.style.userSelect = 'none';
        rightSide.style.pointerEvents = 'none';

    };

    const mouseUpHandler = function () {

        resizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        leftSide.style.removeProperty('user-select');
        leftSide.style.removeProperty('pointer-events');

        rightSide.style.removeProperty('user-select');
        rightSide.style.removeProperty('pointer-events');

        // Remove the handlers of `mousemove` and `mouseup`
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        slickgrid.setColumns(slickgrid.getColumns())
        avgGrid.setColumns(slickgrid.getColumns())
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);

    function readTextFile(file, callback) {
        console.log('file = ' + file)
        let rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", '/uploads' + file, true);
        rawFile.onreadystatechange = function () {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                callback(rawFile.responseText);
            }
        }
        rawFile.send(null);
    }

//usage:
    let fileSplit = new URLSearchParams(window.location.search).get('path').split(';')
    let page = document.getElementById('page')
    let backBtn = document.getElementById('back')
    let fwdBtn = document.getElementById('forward')

    if (fileSplit.length !== 1) {
        for (let i = 1; i <= fileSplit.length; i++) {
            let element = document.createElement('div')
            element.appendChild(document.createTextNode('' + i))
            element.id = 'pageDiv' + i
            element.style.padding = '8px'
            element.style.color = 'black'
            element.style.fontWeight = 'bold'
            element.classList.add('border')
            page.appendChild(element)
            element.addEventListener('click', function () {
                loadPage(parseInt(element.innerHTML))
            })
        }

        backBtn.addEventListener('click', function () {
            let page = getCurrentPage()
            loadPage(page - 1)
        })

        fwdBtn.addEventListener('click', function () {
            let page = getCurrentPage()
            loadPage(page + 1)
        })
        setCurrentPage(1)
    } else {
        document.getElementById('pages').style.display = "none"
    }
    read()

    /*document.getElementById('doMin').addEventListener('click', function () {
        cleanUp()
        if (slickgrid.getSelectedRows().length <= 1) {
            let workaround = []
            for (let i = 0; i < slickgrid.getSelectedRows().length; i++) {
                workaround.push({id: slickgrid.getSortColumns()[i].columnId, name: slickgrid.getSortColumns()[i].columnId, field: slickgrid.getSortColumns()[i].columnId, minWidth: 160})
            }
            avgGrid = new Slick.Grid(document.getElementById('averageGrid'), getAverage(data, workaround, [0, data.length - 1]), workaround, options)
            return
        }
        avgGrid = new Slick.Grid(document.getElementById('averageGrid'), getMax(data, columns, slickgrid.getSelectedRows()), columns, options)
    })*/

    function read() {
        for (let i = 0; i < fileSplit.length; i++) {
            let split = fileSplit[i].split('/')
            let fileStr = split[split.length - 1]
            readTextFile('/' + fileStr + '.DAT', function (text) {
                let json = JSON.parse(text);
                let columns = []
                let data = [];
                let keyList = []
                Object.keys(json).forEach(function (key) {
                    keyList.push(key)
                });
                let keyAmount = keyList.length
                keyList.sort()
                for (let i = 0; i < keyAmount; i++) {
                    columns.push({
                        columnId: keyList[i],
                        id: keyList[i],
                        name: keyList[i].substring(1, keyList[i].length),
                        field: keyList[i],
                        minWidth: 160,
                        sortable: true
                    })
                }
                fileColumns.push(columns)
                for (let i = 0; i < columns.length; i++) {
                    json[columns[i].field] = json[columns[i].field].filter(function (el) {
                        return el != null;
                    })
                }
                let maxLen = json[columns[0].field].length
                for (let i = 0; i < maxLen; i++) {
                    data[i] = {}
                    for (let j = 0; j < columns.length; j++) {
                        data[i][columns[j].field] = json[columns[j].field][i]
                    }
                }
                fileData.push(data);
                if (i === fileSplit.length - 1) loadPage(1)
            })
        }
    }

    function loadPage(page) {
        if (fileSplit.length !== 1) setCurrentPage(page)

        let el = document.getElementById('doPlot')
        let elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('doAverage')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('doSus')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('doSusAvg')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('addValues')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('clearValues')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)
        el = document.getElementById('doMax')
        elClone = el.cloneNode(true)
        el.parentNode.replaceChild(elClone, el)

        let data = fileData[page - 1]
        let columns = fileColumns[page - 1]
        let options = {
            enableCellNavigation: true,
            enableColumnReorder: true,
            fullWidthRows: true,
            editable: true,
            multiColumnSort: true,
            forceFitColumns: true,
            tristateMultiColumnSort: true,
            numberedMultiColumnSort: true
        }
        slickgrid = new Slick.Grid(document.getElementById('grid'), data, columns, options)
        slickgrid.setSelectionModel(new Slick.CellSelectionModel())
        slickgrid.onSort.subscribe(function (e, args) {
            for (let i = 0; i < args.sortCols.length; i++) {
                if (args.sortCols[i].sortAsc === false) {
                    $('#grid').find('.slick-header-column').eq(args.sortCols[i].columnId[0]).trigger('click')
                }
            }
        })
        let ctx = document.getElementById('myChart');
        document.getElementById('doPlot').addEventListener('click', function () {
            if (slickgrid.getSortColumns().length !== 2) {
                alert('Please select 2 columns')
                return;
            }
            cleanUp(false)
            document.getElementById('myChart').style.display = ""
            if (chart === undefined) {
                chart = new Chart(ctx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: getCurrentPage() + '_' + slickgrid.getSortColumns()[0].columnId + "->" + slickgrid.getSortColumns()[1].columnId,
                            data: getLine(data, slickgrid.getSortColumns()[0].columnId, slickgrid.getSortColumns()[1].columnId),
                        }]
                    },
                    options: {
                        responsive: true,
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                });
            } else {
                if (getIndex(chart.data.datasets, data, slickgrid.getSortColumns()[0].columnId, slickgrid.getSortColumns()[1].columnId) !== -1) return;
                chart.data.datasets.push({
                    label: getCurrentPage() + '_' + slickgrid.getSortColumns()[0].columnId + "->" + slickgrid.getSortColumns()[1].columnId,
                    data: getLine(data, slickgrid.getSortColumns()[0].columnId, slickgrid.getSortColumns()[1].columnId)
                })
                chart.update()
            }
            chart.resetZoom()
        })
        document.getElementById('doAverage').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('avgGrid').style.display = ''
            if (isDivEmpty()) {
                let cols = [];
                if (slickgrid.getSortColumns().length === 0) {
                    cols = columns
                } else {
                    for (let i = 0; i < slickgrid.getSortColumns().length; i++) {
                        cols.push(columns[parseInt(slickgrid.getSortColumns()[i].columnId.substring(0, 1))])
                    }
                }
                let rows;
                if (slickgrid.getSelectedRows().length <= 1) {
                    rows = [0, data.length - 1]
                } else {
                    rows = slickgrid.getSelectedRows()
                }
                avgGrid = new Slick.Grid(document.getElementById('avgGrid'), getAverage(data, cols, rows), cols, options)
            } else {
                let cols = []
                Object.keys(getExtremeGrid(true)[0]).forEach(function (key) {
                    cols.push(columns[key.substr(0, 1)])
                })
                avgGrid = new Slick.Grid(document.getElementById('avgGrid'), getAverageGrid(cols), cols, options)
            }
        })
        document.getElementById('doSus').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('myChart').style.display = ""
            let selectedRows = slickgrid.getSelectedRows().length <= 0 ? [0, data.length] : slickgrid.getSelectedRows()
            let keyList = []
            for (let i = 0; i < columns.length; i++) {
                keyList.push(columns[i].name)
            }
            susChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: keyList,
                    datasets: getSus(data, columns, selectedRows)
                },
                options: {
                    legend: {
                        display: false,
                    }
                }
            });
        })
        document.getElementById('doSusAvg').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('myChart').style.display = ""
            let selectedRows = slickgrid.getSelectedRows().length <= 1 ? [0, data.length] : slickgrid.getSelectedRows()
            let keyList = []
            for (let i = 0; i < columns.length; i++) {
                keyList.push(columns[i].name)
            }
            susChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: keyList,
                    datasets: getSusFromAverage(data, columns, selectedRows)
                },
                options: {
                    legend: {
                        display: false,
                    }
                }
            });
        })
        document.getElementById('doMax').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('avgGrid').style.display = ''
            let cols = []
            Object.keys(getExtremeGrid(true)[0]).forEach(function (key) {
                cols.push(columns[key.substr(0, 1)])
            })
            avgGrid = new Slick.Grid(document.getElementById('avgGrid'), getExtremeGrid(true), cols, options)
        })
        document.getElementById('doMin').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('avgGrid').style.display = ''
            let cols = []
            Object.keys(getExtremeGrid(false)[0]).forEach(function (key) {
                cols.push(columns[key.substr(0, 1)])
            })
            avgGrid = new Slick.Grid(document.getElementById('avgGrid'), getExtremeGrid(false), cols, options)
        })

        document.getElementById('export').addEventListener('click', function () {
            let split = fileSplit[getCurrentPage() - 1].split('/')
            window.location.href = window.location.protocol + '//' + window.location.host + '/download/' + split[split.length - 1] + '.DAT'
        })
        document.getElementById('addValues').addEventListener('click', function () {
            cleanUp(true)
            let valueDiv = document.getElementById('selectedValues');
            valueDiv.style.display = ''
            let sortCols = slickgrid.getSortColumns();
            let rows = slickgrid.getSelectedRows()
            if (sortCols !== undefined && sortCols.length > 0) {
                for (let i = 0; i < (sortCols.length === 0 ? columns.length : sortCols.length); i++) {
                    valueDiv.innerHTML += "<br>" + getCurrentPage() + '_' + (sortCols.length === 0 ? columns : sortCols)[i].columnId + ":(" + getMin(rows) + "," + getMax(rows) + ")";
                }
            }
        })
        document.getElementById('showValues').addEventListener('click', function () {
            cleanUp(true)
            let valueDiv = document.getElementById('selectedValues');
            valueDiv.style.display = ''
        })
        document.getElementById('clearValues').addEventListener('click', function () {
            cleanUp(true)
            document.getElementById('selectedValues').innerHTML = '';
        })
    }

    document.getElementById('combine').addEventListener('click', function () {
        let data = getDataFromDiv()
        let dict = {}
        let listlist = []
        let keys = Object.keys(data[0])
        for (let j = 0; j < keys.length; j++) {
            listlist[j] = []
            for (let i = 0; i < data.length; i++) {
                listlist[j].push(data[i][keys[j]])
            }
            dict[keys[j]] = listlist[j]
        }
        fetch('/combine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.parse(JSON.stringify(dict))),
            redirect: 'follow'})
    })

    function cleanUp(cleanChart) {
        if (avgGrid !== undefined && avgGrid !== null) {
            avgGrid.destroy()
            avgGrid = undefined
            document.getElementById('avgGrid').style.display = "none";
        }
        if (chart !== undefined) {
            if (cleanChart) {
                chart.destroy()
                chart = undefined
            }
            document.getElementById('myChart').style.display = "none";
        }
        if (susChart !== undefined) {
            susChart.destroy()
            susChart = undefined
        }
        document.getElementById('selectedValues').style.display = "none";
    }

    function getExtremeGrid(isMax) {
        let data = getDataFromDiv()
        let keys = Object.keys(data[0])
        let extreme = []
        for (let j = 0; j < keys.length; j++) {
            extreme.push(data[0][keys[j]])
        }
        let out = []
        out[0] = {}
        for (let i = 0; i < Object.keys(data).length; i++) {
            for (let j = 0; j < keys.length; j++) {
                if (isMax && data[i][keys[j]] > extreme[j]) extreme[j] = data[i][keys[j]]
                else if (!isMax && data[i][keys[j]] < extreme[j]) extreme[j] = data[i][keys[j]]
            }
        }
        for (let j = 0; j < keys.length; j++) {
            out[0][keys[j]] = extreme[j]
        }
        return out
    }

    function getDataFromDiv() {
        let split = String(document.getElementById('selectedValues').innerHTML).split('<br>')
        let outData = []
        for (let i = 1; i < split.length; i++) {
            let ssplit = split[i].split(':')
            let pageSplit = ssplit[0].split('_')
            let page = parseInt(pageSplit[0]) - 1
            let minmax = ssplit[1].replace('(', '').replace(')', '').split(',')
            let min = parseInt(minmax[0])
            let max = parseInt(minmax[1])
            for (let j = min; j <= max; j++) {
                if (outData[j - min] === undefined) outData[j - min] = {}
                outData[j - min][pageSplit[1]] = fileData[page][j][pageSplit[1]]
            }
        }
        return outData
    }

    function isDivEmpty() {
        return document.getElementById('selectedValues').innerHTML === ''
    }

    function getIndex(arr, ele, i1, i2) {
        for (let i = 0; i < arr.length; i++) {
            if (JSON.stringify(arr[i].data) === JSON.stringify(getLine(ele, i1, i2))) return i;
        }
        return -1
    }

    function getMin(arr) {
        let min = arr[0];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < min) min = arr[i]
        }
        return min
    }

    function getMax(arr) {
        let max = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] > max) max = arr[i]
        }
        return max
    }

    function getColumn(anArray, column) {
        //console.log('fkOff = ' + anArray)
        return anArray.map(function (row) {
            return row[column];
        });
    }

    function getLine(arr, i1, i2) {
        let dict = []
        let arr1 = getColumn(arr, i1)
        let arr2 = getColumn(arr, i2)
        arr1.splice(0, 1)
        arr2.splice(0, 1)
        /*console.log('arr = ' + arr)
        console.log('arr1 = ' + arr1)
        console.log('arr2 = ' + arr2)*/
        for (let i = 0; i < arr1.length; i++) {
            dict[i] = {
                x: arr1[i],
                y: arr2[i]
            }
        }
        return dict
    }

    function getSus(arr, columns, selectedRows) {
        let out = []
        let min = getMin(selectedRows)
        let max = getMax(selectedRows)
        for (let i = min; i <= max; i++) {
            let tmpDict = {}
            let tmpArr = []
            for (let j = 0; j < columns.length; j++) {
                tmpArr[j] = arr[i][columns[j].field]
            }
            tmpDict['label'] = (i)
            tmpDict['data'] = tmpArr
            out[i - min] = tmpDict
        }
        return out
    }

    function getAverage(data, columns, selectedRows) {
        let data2 = []
        data2[0] = {}
        let min = getMin(selectedRows)
        let max = getMax(selectedRows)
        for (let i = 0; i < columns.length; i++) {
            let invArr = getColumn(data, columns[i].columnId === undefined ? columns[i].field : columns[i].columnId)
            let sum = 0
            for (let j = min; j <= max; j++) {
                sum += parseFloat(invArr[j])
            }
            data2[0][columns[i].columnId === undefined ? columns[i].field : columns[i].columnId] = sum / (max - min + 1)
        }
        return data2
    }

    function getAverageGrid(columns) {
        let data = getDataFromDiv()
        return getAverage(data, columns, [0, data.length - 1])
    }

    function getSusFromAverage(data, columns, selectedRows) {
        let out = []
        let avg = getAverage(data, columns, selectedRows)
        let min = getMin(selectedRows)
        let max = getMax(selectedRows)
        for (let i = min; i <= max; i++) {
            let tmpDict = {}
            let tmpArr = []
            for (let j = 0; j < columns.length; j++) {
                tmpArr[j] = data[i][columns[j].columnId === undefined ? columns[j].field : columns[j].columnId] - Math.abs(avg[0][columns[j].columnId === undefined ? columns[j].field : columns[j].columnId])
            }
            tmpDict['label'] = (i)
            tmpDict['data'] = tmpArr
            out[i - min] = tmpDict
        }
        return out
    }

    function getCurrentPage() {
        let div = document.getElementById('page')
        let nodes = div.childNodes
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].style.color === 'blue') return i + 1
        }
        return 1;
    }

    function setCurrentPage(page) {
        let cur = getCurrentPage()
        if (page === 1) {
            backBtn.disabled = true
            if (fwdBtn.disabled) fwdBtn.disabled = false
        } else if (page === fileSplit.length) {
            fwdBtn.disabled = true
            if (backBtn.disabled) backBtn.disabled = false
        } else {
            if (fwdBtn.disabled) fwdBtn.disabled = false
            if (backBtn.disabled) backBtn.disabled = false
        }

        if (cur !== -1) document.getElementById('pageDiv' + cur).style.color = 'black'
        let div = document.getElementById('pageDiv' + page)
        div.style.color = 'blue'
    }
})