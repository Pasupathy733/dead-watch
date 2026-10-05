from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import smtplib
import base64
from email.message import EmailMessage

GMAIL_USER = "pasupathy733@gmail.com"
GMAIL_APP_PASSWORD = "jhhx phxn tmnd iopu"

class EmailServer(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):

        if self.path != "/send-notification":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(length))

        recipient = data.get("recipient")
        subject = data.get("subject")
        message = data.get("message")
        attachment = data.get("attachment")

        try:

            email = EmailMessage()

            email["From"] = GMAIL_USER
            email["To"] = recipient
            email["Subject"] = subject

            email.set_content(message)
            if attachment:
                filename = attachment.get("name", "legacy-file")
                mime_type = attachment.get(
                "type",
                "application/octet-stream"
            )
            data_url = attachment.get("data", "")

            if "," in data_url:
                _, encoded = data_url.split(",", 1)
            else:
                encoded = data_url

            file_bytes = base64.b64decode(encoded)

            if "/" in mime_type:
                maintype, subtype = mime_type.split("/", 1)
            else:
                maintype = "application"
                subtype = "octet-stream"

            email.add_attachment(
                file_bytes,
                maintype=maintype,
                subtype=subtype,
                filename=filename
            )

          
      
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
                smtp.send_message(email)

            response = {
                "success": True,
                "message": "Email sent successfully"
            }

            self.send_response(200)

        except Exception as error:

            print("Email error:", error)

            response = {
                "success": False,
                "message": str(error)
            }

            self.send_response(500)

        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

        self.wfile.write(
            json.dumps(response).encode()
        )


server = HTTPServer(("localhost", 3000), EmailServer)

print("Digital Legacy Backend running...")
print("http://localhost:3000")

server.serve_forever()