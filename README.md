# 🗂️ Self-Hosted File Manager

**Self-Hosted File Manager** is an open-source web application that lets you turn your own server into a personal cloud storage solution — just like Google Drive or OneDrive, but 100% under your control 💪.

---

## 🚀 Features (WIP)

✅ Upload and download files from anywhere  
✅ Lightweight and easy to deploy  
✅ Runs on your own hardware = full privacy  
✅ Can be accessed from any device with a browser  
🛡️ No external dependency = maximum control

More features coming soon 👇

---

## 📦 Requirements

**Mandatory:**

- Python 3 virtual environment  
- Flask, `os`, and `socket` libraries installed  
- Open access to **port 5080** (can be changed in the code)

**Recommended Setup:**

- Host on a Linux server (tested on Ubuntu Server 20.04)  
- Use external or network-attached storage for larger capacity  
- Configure the `cloud.service` file (found in `static/`) to auto-start `app.py` on server boot  
- Open the port on your router to access files remotely  
- Keep your access link private to maintain security  
- Be aware: this project is in early development — we can’t yet guarantee full file protection

---

## 🔒 Security Note

We take privacy seriously, but this is an early-stage project.  
Avoid hosting sensitive data publicly. Authentication is not yet implemented (but coming soon!).

> **⚠️ Disclaimer**: We are not responsible for any illegal use or file hosting done through this project.

---

## 🛠️ Roadmap (Coming Soon)

- [ ] Share button for individual files  
- [ ] Support tab  
- [ ] Self-hostable website builder  
- [ ] “...” menu for file actions (rename, delete, etc.)  
- [ ] “Create ZIP” feature  
- [ ] Folder support  
- [ ] File filters (e.g., show only PDFs, images, etc.)  
- [ ] `requirements.txt` for easier setup  
- [ ] Online PowerPoint editor  
- [ ] Online Excel editor  
- [ ] Auto-update mechanism  
- [ ] Audio player  
- [ ] User login & password authentication system  

---

## 🤝 Contribute

Got a feature idea? Found a bug? Want to help?  
Feel free to open an issue or a pull request — all contributions are welcome!

---

### 💡 Tip

This is a great alternative to mainstream cloud providers if you care about **privacy**, **flexibility**, and **open-source tools** 🔓

---

Made with ❤️ by passionate dev.
