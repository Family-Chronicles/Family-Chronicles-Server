import nodemailer from "nodemailer";

export interface MailMessage {
	to: string;
	subject: string;
	text: string;
}

export interface Mailer {
	send(message: MailMessage): Promise<void>;
}

/** Sends mails via SMTP, e.g. SMTP_URL=smtps://user:password@mail.example.org:465 */
export class SmtpMailer implements Mailer {
	private transport;

	constructor(url: string, private readonly from: string) {
		this.transport = nodemailer.createTransport(url);
	}

	async send(message: MailMessage): Promise<void> {
		await this.transport.sendMail({ from: this.from, ...message });
	}
}

/** Keeps mails in memory – for tests */
export class MemoryMailer implements Mailer {
	public readonly sent: MailMessage[] = [];

	async send(message: MailMessage): Promise<void> {
		this.sent.push(message);
	}
}
