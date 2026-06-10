# ==============================================================
# CV Generator – terraform/main.tf
# Provisions an EC2 instance on AWS (eu-north-1) with a
# security group for SSH, HTTP, and Node.js traffic.
# ==============================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.3.0"
}

# ── Provider ───────────────────────────────────────────────────
provider "aws" {
  region = "eu-north-1"
}

# ── Latest Ubuntu 22.04 LTS AMI (dynamically resolved) ────────
data "aws_ami" "ubuntu_22_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# ── Security Group ─────────────────────────────────────────────
resource "aws_security_group" "cv_generator_sg" {
  name        = "cv-generator-sg"
  description = "Allow SSH, HTTP, and Node.js traffic for CV Generator"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (nginx reverse proxy)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Node.js app
  ingress {
    description = "Node.js"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "cv-generator-sg"
    Project = "cv-generator"
  }
}

# ── EC2 Instance ───────────────────────────────────────────────
resource "aws_instance" "cv_generator" {
  ami                    = data.aws_ami.ubuntu_22_04.id
  instance_type          = "t3.micro"
  key_name               = "cv-generator-key"
  vpc_security_group_ids = [aws_security_group.cv_generator_sg.id]

  # Ensure the instance gets a public IP
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name    = "cv-generator"
    Project = "cv-generator"
  }
}

# ── Outputs ────────────────────────────────────────────────────
output "public_ip" {
  description = "Public IP address of the CV Generator EC2 instance"
  value       = aws_instance.cv_generator.public_ip
}

output "public_dns" {
  description = "Public DNS name of the CV Generator EC2 instance"
  value       = aws_instance.cv_generator.public_dns
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.cv_generator.id
}

output "ami_used" {
  description = "Ubuntu 22.04 AMI resolved for eu-north-1"
  value       = data.aws_ami.ubuntu_22_04.id
}
