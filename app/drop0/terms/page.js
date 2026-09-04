export const metadata = {
  title: 'MOGI — Drop 0 Terms',
  description: 'Buyer terms for MOGI Drop 0.',
}

// ponytail: plain server component. The text is the PDF's, typed out rather than
// embedded — a PDF viewer mid-claim on a phone is worse than a page, and this one
// styles and links. The PDF stays in /public for anyone who wants the file.
const TERMS = [
  ['All sales are final',
    'No refunds, no exchanges, no cancellations once payment is confirmed. This applies to all reasons, including but not limited to: change of mind, sizing, delivery time, or personal circumstances.'],
  ['Handmade and print variation is expected, not a defect',
    'Each piece is hand-altered and screen-printed in small batch. Minor variation in print placement, ink texture, stitching, or garment shortening between pieces is part of the product, not a fault. This is not grounds for refund, exchange, or replacement.'],
  ['No liability once shipped',
    'Once a piece is handed to the delivery courier, MOGI is not responsible for loss, delay, or damage that occurs in transit. Any issue with a package after it leaves our hands is between the buyer and the courier/delivery service.'],
  ['Buyer is responsible for accurate shipping information',
    'The buyer must provide a correct and complete delivery address and contact number. MOGI is not responsible for non-delivery, delay, or loss caused by incorrect or incomplete information provided by the buyer.'],
  ['Delivery timing is an estimate, not a guarantee',
    'Stated delivery windows (e.g. "within 2 weeks") are estimates. Delays caused by courier services, customs, or circumstances outside MOGI’s control are not grounds for refund or compensation.'],
  ['Payment and claim process', [
    'Claiming a piece holds it for 30 minutes. If payment with the correct code is not received in that window, the claim is released and the piece returns to general availability.',
    'Payment must be sent with the assigned code in the payment note. MOGI is not responsible for confirming payments that cannot be matched to a code.',
    'Once payment is confirmed, the buyer is considered the confirmed holder of that numbered piece.',
  ]],
  ['Authenticity',
    'Each piece is numbered and its edition is not reissued. MOGI does not authenticate, verify, or take responsibility for pieces resold or transferred between buyers after original sale.'],
  ['Right to refuse or cancel a claim',
    'MOGI reserves the right to cancel any claim suspected of abuse, fraud, fake payment proof, or violation of these terms, without obligation to fulfill that order.'],
  ['Limitation of liability',
    'MOGI’s total liability for any claim relating to a purchase is limited to the amount paid for that piece. MOGI is not liable for any indirect, incidental, or consequential loss.'],
]

export default function TermsPage() {
  return (
    <main className="terms-page">
      <div className="terms-eyebrow">MOGI · read before claiming a piece</div>
      <h1 className="terms-title">Drop 0 — Terms &amp; Conditions</h1>
      <p className="terms-intro">
        By claiming a numbered piece and completing payment, the buyer agrees to the terms below.
      </p>

      <ol className="terms-list">
        {TERMS.map(([heading, body]) => (
          <li key={heading}>
            <h2>{heading}</h2>
            {Array.isArray(body)
              ? <ul>{body.map(line => <li key={line}>{line}</li>)}</ul>
              : <p>{body}</p>}
          </li>
        ))}
      </ol>

      <p className="terms-intro">
        By sending payment for a claimed piece, the buyer confirms they have read and agree to
        these terms in full.
      </p>

      <p className="terms-foot">
        MOGI · DROP 0 ·{' '}
        <a href="/pics/MOGI_Drop0_Terms_and_Conditions.pdf" target="_blank" rel="noopener noreferrer">
          download as PDF
        </a>
      </p>
    </main>
  )
}
