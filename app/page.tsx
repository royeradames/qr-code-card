import Image from "next/image";

export default function Home() {
  return (
    <>
      <main>
        <article className="qr-card" aria-labelledby="card-title">
          <Image
            className="qr-image"
            src="/images/image-qr-code.png"
            alt="QR code that opens Frontend Mentor. The text link below goes to the same place."
            width={288}
            height={288}
            preload
            unoptimized
          />
          <div className="card-copy">
            <h1 id="card-title">Improve your front-end skills by building projects</h1>
            <p>
              Scan the QR code to visit <a href="https://www.frontendmentor.io/">Frontend Mentor</a> and take your coding skills to
              the next level
            </p>
          </div>
        </article>
      </main>
      <footer>
        <p>
          Built by <a href="https://royeradames.com">Royer Adames</a> for the{" "}
          <a href="https://www.frontendmentor.io/challenges/qr-code-component-iux_sIO_H">QR code challenge</a>.
        </p>
      </footer>
    </>
  );
}
