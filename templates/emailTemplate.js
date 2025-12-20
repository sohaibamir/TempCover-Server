export const emailTemplate = ({ name, link }) => {
  return `
    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">
    <p style="font-weight:bold">Hi ${name},</p>

      <p>You can relax now, everything is taken care of. Your temporary insurance policy is in place and will begin at the time you selected.</p>

      <p>Check out the summary of your policy and a link to view and print your policy documents below.</p>

      <p>Thanks again for choosing 
        <a href="${link}" style="color:#0066cc; text-decoration:none;">tempcover.com</a> 
        for your temporary insurance needs - we hope to see you again soon.
      </p>

      <p style="font-size:12px; color:#666; font-style:italic;">
        This policy meets the Demands and Needs of a customer who wishes to insure a vehicle for a short period.
      </p>

      <div style="margin:18px 0;">
        <a href="${link}" 
          style="display:inline-block; padding:10px 18px; background:#4CAF50; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">
          View your policy documents
        </a>
      </div>
    </div>
  `;
};