from flask import Flask, render_template, request, jsonify, send_from_directory, make_response, redirect, url_for
import os, socket, string, random
import json
import jwt
import datetime
import re
import paramiko
import threading
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

def generate_strong_password(longueur):
    # Vérifie que la longueur est un nombre entier positif
    if longueur <= 0:
        raise ValueError("La longueur du mot de passe doit être un entier positif.")
    
    # Définir les caractères utilisables pour le mot de passe
    caracteres = string.ascii_letters + string.digits + string.punctuation
    
    # Générer le mot de passe aléatoire
    mot_de_passe = ''.join(random.choice(caracteres) for _ in range(longueur))
    
    return mot_de_passe

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'indd', 'flv', 'css', 'ps', 'fla', 'midi', 'mpg', 'dat', 'wmv', 'iso', 'dmg', 'cad', 'js', 'tif', 'html', 'php', 'aac', '3ds', 'raw', 'doc', 'mp3', 'xls', 'zip', 'gif', 'psd', 'eps', 'bmp', 'cdr', 'avi', 'ai', 'dll', 'mov', 'sql', 'ppt', 'svg', 'xml', 'csv', 'jpg', 'pdf', 'png', 'txt', 'ipa', 'deb', 'p12', 'mobileprovision', 'mp4', '3ds', 'docx'}

app.config['SECRET_KEY'] = generate_strong_password(random.randint(8, 100))  # Change ça en une clé secrète plus complexe

file_path = os.path.join(os.path.dirname(__file__), 'users.json')
with open(file_path, 'r') as f:
    users = json.load(f)['users']

def check_credentials(username, password):
    for user in users:
        if user['username'] == username and user['password'] == password:
            return True
    return False

def generate_token(username):
    token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=120)  # Token valable pour 120 minutes
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return token

# Routes existantes
@app.route('/uploads/<path:filename>', methods=['GET', 'POST'])
def uploaded_file(filename):
    if request.method == 'GET':
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    elif request.method == 'POST':
        content = request.json.get('content')
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(file_path, 'w') as file:
            file.write(content)
        return jsonify({'message': 'File saved successfully'})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ref.html')
def reference():
    return render_template('ref.html')

@app.route('/files.html')
def files():
    return render_template('files.html')

@app.route('/settings.html')
def settings():
    return render_template('settings.html')

@app.route('/t.html')
def terminal():
    return render_template('t.html')

@app.route('/manifest.json')
def manifest():
    return render_template('manifest.json')

@app.route('/uploads/', methods=['GET', 'POST', 'DELETE'])
def upload_file():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'})
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'})
        if file and allowed_file(file.filename):
            filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filename)
            return jsonify({'message': 'File uploaded successfully'})
        else:
            return jsonify({'error': 'File type not allowed'})
    elif request.method == 'GET':
        files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if os.path.isfile(os.path.join(app.config['UPLOAD_FOLDER'], f))]
        return jsonify({'files': files})
    elif request.method == 'DELETE':
        filename = request.args.get('filename', '')
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'message': 'File deleted successfully'})
        else:
            return jsonify({'error': 'File not found'})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if check_credentials(username, password):
            token = generate_token(username)
            response = make_response(jsonify({"success": True}))
            response.set_cookie('token', token, httponly=True, samesite='Strict')
            return response
        else:
            return jsonify({"success": False}), 401
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    token = request.cookies.get('token')

    if not token:
        return redirect(url_for('login'))

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        new_token = generate_token(data['username'])
        response = make_response(render_template('files.html', username=data['username']))
        response.set_cookie('token', new_token, httponly=True, samesite='Strict')
        return response
    except jwt.ExpiredSignatureError:
        return redirect(url_for('login'))
    except jwt.InvalidTokenError:
        return redirect(url_for('login'))

@app.route('/logout')
def logout():
    response = make_response(redirect(url_for('index')))
    response.set_cookie('token', '', expires=0)
    return response

@app.route('/verify-token', methods=['POST'])
def verify_token():
    token = request.cookies.get('token')

    if not token:
        return jsonify({"valid": False}), 401

    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return jsonify({"valid": True, "username": data['username']})
    except jwt.ExpiredSignatureError:
        return jsonify({"valid": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"valid": False, "error": "Invalid token"}), 401

# Nouveau code pour la gestion des connexions SSH via WebSocket
clients = {}

def clean_ansi_codes(text):
    ansi_escape = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
    cleaned_text = ansi_escape.sub('', text)
    specific_sequences = re.compile(r'\x1b\[.*?m')
    cleaned_text = specific_sequences.sub('', cleaned_text)
    return cleaned_text

@socketio.on('connect_ssh')
def connect_ssh(data):
    sid = data['sid']
    ip = data['ip']
    username = data['username']
    password = data['password']

    try:
        ssh_client = paramiko.SSHClient()
        ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_client.connect(ip, username=username, password=password)
        channel = ssh_client.invoke_shell()
        clients[sid] = {'client': ssh_client, 'channel': channel}

        thread = threading.Thread(target=listen_to_ssh, args=(sid, channel))
        thread.start()

        emit('ssh_output', {'output': 'Connexion SSH établie.\n'}, room=sid)
    except Exception as e:
        emit('ssh_output', {'output': f'Erreur : {str(e)}'}, room=sid)

def listen_to_ssh(sid, channel):
    try:
        while True:
            if channel.recv_ready():
                raw_output = channel.recv(1024).decode('utf-8', errors='ignore')
                clean_output = clean_ansi_codes(raw_output)
                socketio.emit('ssh_output', {'output': clean_output}, room=sid)
    except Exception as e:
        socketio.emit('ssh_output', {'output': f'Erreur : {str(e)}'}, room=sid)

@socketio.on('send_command')
def send_command(data):
    sid = data['sid']
    command = data['command']

    if sid in clients:
        channel = clients[sid]['channel']
        channel.send(command + '\n')

@socketio.on('disconnect')
def disconnect():
    sid = request.sid
    if sid in clients:
        clients[sid]['client'].close()
        del clients[sid]

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5080, debug=True)