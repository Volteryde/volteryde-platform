terraform {
  backend "s3" {
    bucket         = "volteryde-terraform-state-sa-east-1"
    key            = "production/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "volteryde-terraform-locks"
    encrypt        = true
  }
}
