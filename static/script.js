let sortOrder = 'default';

const player = videojs('my-video');

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video', 'formula'],

    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],

    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
  
    ['clean']
  ];

document.addEventListener('DOMContentLoaded', function () {
    displayFileList();

    document.getElementById('fileInput').addEventListener('change', function () {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (file) {
            uploadFile(file);
        }
    });

    document.getElementById('uploadButton').addEventListener('click', function () {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (file) {
            uploadFile(file);
        }
    });

    document.getElementById('sortAlphabetical').addEventListener('click', function () {
        sortOrder = 'alphabetical';
        displayFileList();
    });

    document.getElementById('sortAntiAlphabetical').addEventListener('click', function () {
        sortOrder = 'antiAlphabetical';
        displayFileList();
    });

    document.getElementById('sortDefault').addEventListener('click', function () {
        sortOrder = 'default';
        displayFileList();
    });

    setInterval(function () {
        displayFileList();
    }, 300000);
});

function uploadFile(file) {
    const loadBar = document.getElementById('loadBar');
    loadBar.style.visibility = 'visible';
    loadBar.style.height = 'auto';
    const formData = new FormData();
    formData.append('file', file);

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function (e) {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.value = percentComplete;
            progressText.textContent = `${percentComplete.toFixed(2)}%`;
        }
    });

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.message) {
                    console.log(response.message);
                } else {
                    console.log(response.error);
                }
                loadBar.style.visibility = 'hidden';
                loadBar.style.height = '0px';
                displayFileList();
            } else {
                console.log('Error uploading file: ' + xhr.statusText);
            }
        }
    };

    xhr.open('POST', '/uploads', true);

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['indd', 'flv', 'css', 'ps', 'fla', 'midi', 'mpg', 'dat', 'wmv', 'iso', 'dmg', 'cad', 'js', 'tif', 'html', 'php', 'aac', '3ds', 'raw', 'doc', 'mp3', 'xls', 'zip', 'gif', 'psd', 'eps', 'bmp', 'cdr', 'avi', 'ai', 'dll', 'mov', 'sql', 'ppt', 'svg', 'xml', 'csv', 'jpg', 'pdf', 'png', 'txt', 'ipa', 'deb', 'p12', 'mobileprovision', 'mp4', '3ds', 'docx'].includes(fileExtension)) {
        alert('Le type de fichier n\'est pas pris en charge.');
        return;
    }

    xhr.send(formData);
}

function displayFileList() {
    // Vérification du token lors du chargement de la page
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            fetch('/uploads')
                .then(response => response.json())
                .then(data => {
                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = '';

                    let sortedFiles = data.files;

                    if (sortOrder === 'alphabetical') {
                        sortedFiles = sortedFiles.sort();
                    } else if (sortOrder === 'antiAlphabetical') {
                        sortedFiles = sortedFiles.sort().reverse();
                    }

                    sortedFiles.forEach(file => {
                        const listItem = document.createElement('li');
                        const span = document.createElement('span');

                        const fileExtension = file.split('.').pop().toLowerCase();
                        const iconPath = `/static/img/${fileExtension}.png`;

                        listItem.style.backgroundImage = `url('${iconPath}')`;
                        listItem.style.backgroundSize = '70% auto';
                        listItem.style.backgroundRepeat = 'no-repeat';
                        listItem.style.backgroundPosition = 'center';

                        listItem.appendChild(document.createElement('br'));

                        const name = document.createElement('h3');
                        name.textContent = file;
                        listItem.appendChild(name);

                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.marginTop = '0px';

                        const downloadButton = document.createElement('button');
                        downloadButton.textContent = 'Download';
                        downloadButton.addEventListener('click', function () {
                            downloadFile(file);
                        });

                        buttonContainer.appendChild(downloadButton);

                        const openButton = document.createElement('button');
                        openButton.textContent = 'Open';
                        openButton.style.visibility = 'hidden';

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.addEventListener('click', function () {
                            deleteFile(file);
                        });

                        buttonContainer.appendChild(deleteButton);

                        if (isBrowserReadable(file)) {
                            openButton.style.visibility = 'visible';
                            openButton.addEventListener('click', function () {
                                openFile(`/uploads/${file}`);
                            });

                            buttonContainer.appendChild(openButton);
                        }

                        const videoExtensions = ['mp4', 'webm', 'mov'];
                        if (videoExtensions.includes(fileExtension)) {
                            const playButton = document.createElement('button');
                            playButton.textContent = 'Watch';
                            playButton.addEventListener('click', function () {
                                playVideo(`/uploads/${file}`);
                                show(document.getElementById('my-video'), "None", "None", "None", "None", "None");
                                show(document.getElementById('closeV'), "None", "None", "None", "None", "None");
                            });
                            buttonContainer.appendChild(playButton);
                        }

                        const soundExtensions = ['mp3', 'wav', 'aac', 'flac'];
                        if (soundExtensions.includes(fileExtension)) {
                            const playButton2 = document.createElement('button');
                            playButton2.textContent = 'Play';
                            playButton2.addEventListener('click', function () {
                                comingSoon("Sound playing")
                            });
                            buttonContainer.appendChild(playButton2);
                        }

                        const excelExtensions = ['xls', 'xlsb', 'xlsm', 'xlsx', 'csv'];
                        if (excelExtensions.includes(fileExtension)) {
                            const editExcelButton = document.createElement('button');
                            editExcelButton.textContent = 'Edit';
                            editExcelButton.addEventListener('click', function () {
                                comingSoon("Edit Excel files")
                            });
                            buttonContainer.appendChild(editExcelButton);
                        }

                        const textExtension = ['txt', 'css', 'js', 'html', 'py'];
                        if (textExtension.includes(fileExtension)) {
                            const textButton = document.createElement('button');
                            textButton.textContent = 'Edit';
                            textButton.addEventListener('click', function () {
                                editFile(file);
                            });
                            buttonContainer.appendChild(textButton);
                        }

                        listItem.appendChild(buttonContainer);
                        span.appendChild(listItem);
                        fileList.appendChild(span);
                    });
                })
                .catch(error => console.error('Error fetching file list:', error));
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}


function deleteFile(filename) {
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            fetch(`/uploads?filename=${encodeURIComponent(filename)}`, {
                method: 'DELETE',
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                    displayFileList();
                })
                .catch(error => console.error('Error deleting file:', error));
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}

function downloadFile(filename) {
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            const downloadLink = document.createElement('a');
            downloadLink.href = `/uploads/${filename}`;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}

function openFile(url) {
    window.open(url, '_blank');
}

function playVideo(url) {
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            player.src({ type: 'video/mp4', src: url });
            show(document.getElementById('my-video'), "500px", "250px", "20px", "20px", "block");
            show(document.getElementById('closeV'), "auto", "auto", "20px", "20px", "block");

            const f = document.getElementById('files');
            f.style.display = "none";

            const closeButton = document.getElementById('closeV');
            closeButton.style.visibility = "visible";
            player.style.visibility = "visible";
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}

function isBrowserReadable(filename) {
    const readableExtensions = ['pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'mp3', 'ogg', 'wav', 'mp4', 'webm'];
    const ext = filename.split('.').pop().toLowerCase();
    return readableExtensions.includes(ext);
}

function editFile(filename) {
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            fetch(`/uploads/${filename}`)
                .then(response => response.text())
                .then(data => {
                    const f = document.getElementById('files');
                    f.style.display = "none";
                    const editorContainer = document.getElementById('editor-container');
                    editorContainer.innerHTML = '';
                    editorContainer.style.width = "90%";
                    editorContainer.style.height = "500px";
                    editorContainer.style.marginTop = "20px";
                    editorContainer.style.marginBottom = "320px";

                    const editor = document.createElement('div');
                    editor.setAttribute('id', 'editor');
                    editorContainer.appendChild(editor);

                    const quill = new Quill('#editor', {
                        theme: 'snow',
                        modules: {
                            toolbar: toolbarOptions
                        }
                    });

                    quill.root.innerHTML = data;

                    const exitButton = document.createElement('button');
                    exitButton.textContent = 'Exit';
                    exitButton.addEventListener('click', function () {
                        location.href = ""
                    });
                    editorContainer.appendChild(exitButton);

                    const saveButton = document.createElement('button');
                    saveButton.textContent = 'Save';
                    saveButton.addEventListener('click', function () {
                        saveFile(filename, quill.root.innerHTML);
                    });
                    editorContainer.appendChild(saveButton);

                })
                .catch(error => console.error('Error editing file:', error));
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}

function show(element, width, height, marginTop, marginBottom, display) {
    element.style.width = width;
    element.style.height = height;
    element.style.marginTop = marginTop;
    element.style.marginBottom = marginBottom;
    element.style.display = display;
}

function saveFile(filename, content) {
    fetch('/verify-token', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            fetch(`/uploads/${filename}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename: filename, content: content })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message);
                })
                .catch(error => console.error('Error saving file:', error));
        } else {
            window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
        }
    });
}

function comingSoon(thing) {
    alert(thing + " will coming soon !")
}

fetch('/verify-token', {
    method: 'POST',
})
.then(response => response.json())
.then(data => {
    if (data.valid) {
        
    } else {
        window.location.href = '/'; // Redirection vers la page d'accueil si le token n'est pas valide
    }
});