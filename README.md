# CV Generator

A CV Generator web app powered by Anthropic Claude AI. Built with HTML, CSS, JavaScript and Node.js. Hosted on AWS EC2.

## Live Demo

http://13.53.205.58

## What It Does

The user fills out a form with their name, job title, work experience, skills, and education. The app sends the data to the backend, which calls the Anthropic Claude API to generate a professional CV. The result appears on the page and can be copied or printed.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: Anthropic Claude API (claude-haiku-4-5-20251001) — requires API credits
- Cloud: AWS EC2 (eu-north-1)
- Infrastructure: Terraform
- Configuration: Ansible
- Web server: Nginx

## Project Structure

```
cv-generator/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   └── .env
├── terraform/
│   └── main.tf
├── ansible/
│   ├── playbook.yml
│   └── inventory.ini
└── package.json
```

## How to Run Locally

1. Clone the repo

```
git clone https://github.com/Kong-2000/CV-Generator.git
cd CV-Generator
```

2. Install dependencies

```
npm install
```

3. Add your API key to backend/.env

```
ANTHROPIC_API_KEY=sk-ant-...your key here
```

4. Start the backend

```
npm run dev
```

5. Open frontend/index.html in your browser

## AWS Deployment

Infrastructure is provisioned with Terraform and configured with Ansible.

### Provision the server

```
cd terraform
terraform init
terraform apply
```

### Configure the server

Update ansible/inventory.ini with the public IP from Terraform, then run:

```
cd ansible
ansible-playbook -i inventory.ini playbook.yml --private-key ~/.ssh/cv-generator-key.pem
```

### Add API key on the server

```
ssh -i ~/.ssh/cv-generator-key.pem ubuntu@<PUBLIC_IP>
nano ~/CV-Generator/backend/.env
pm2 restart cv-generator
```

## Author

Naphatsakorn Jeeraon
