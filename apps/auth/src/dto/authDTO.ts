export class RegisterDTO {
  name!: string;
  email!: string;
  phone!: string;
  role!: string;
  password!: string;
}

export class LoginDTO {
  email!: string;
  password!: string;
}
