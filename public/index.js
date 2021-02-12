$(document).ready(function () {
    function dateiauswahl(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        let gewaehlteDateien = evt.dataTransfer.files; // FileList Objekt


        let output = [];
        for (let i = 0, f; f = gewaehlteDateien[i]; i++) {
            output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                /*f.lastModified.toLocaleDateString(), */'</li>');
        }
        let blobs = []
        function readerOnLoad (fileData) {
            console.log('fileData = ' + fileData)
            console.log('fileData = ' + fileData.target.result)
            console.log('fileData = ' + dataURItoBlob(fileData.target.result))
            blobs.push(dataURItoBlob(fileData.target.result));
            if (blobs.length === gewaehlteDateien.length) sendRequest(blobs, gewaehlteDateien)
        }
        for (let i = 0; i < gewaehlteDateien.length; i++) {
            let reader = new FileReader()
            reader.onload = readerOnLoad
            reader.readAsDataURL(gewaehlteDateien[i])
        }
        document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    }

    function sendRequest(blobs, gewaehlteDateien) {
        let fd = new FormData(document.forms[0]);
        console.log('chosen one = ' + JSON.stringify(gewaehlteDateien))
        for (let i = 0; i < blobs.length; i++) {
            fd.append('files', blobs[i], gewaehlteDateien[i].name)
            console.log('blob = ' + blobs[i])
            console.log('chose = ' + gewaehlteDateien[i])
        }
        //fd.append('name', gewaehlteDateien[0].name)
        //fd.append("file", blob);
        fetch('/upload', {method: 'POST', redirect: "follow", body: fd}).then(function (res) {
            console.log('res = ' + res.redirected)
            if (res.redirected) {
                window.location.href = res.url
            }
        })
        let keys = fd.keys()
        console.log('file = ' + keys.next().value)
        console.log('file = ' + keys.next().value)
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    // Initialisiere Drag&Drop EventListener
    let dropZone = document.getElementById('dropzone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', dateiauswahl, false);
})

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    let byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    //Old Code
    //write the ArrayBuffer to a blob, and you're done
    //var bb = new BlobBuilder();
    //bb.append(ab);
    //return bb.getBlob(mimeString);

    //New Code
    return new Blob([ab], {type: mimeString});


}