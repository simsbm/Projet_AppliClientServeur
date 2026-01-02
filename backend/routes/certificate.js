const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const db = require('./config/database'); // votre connexion MySQL

router.get('/school/:matricule', async (req, res) => {
  try {
    const { matricule } = req.params;

    const [rows] = await db.query(
      `SELECT full_name, matricule, class, level,
              academic_year, financial_status
       FROM students
       WHERE matricule = ?`,
      [matricule]
    );

    if (!rows.length) {
      return res.status(404).send('Étudiant introuvable');
    }

    const student = rows[0];

    // Sécurité financière
    if (student.financial_status !== 'PAID') {
      return res.status(403).send('Situation financière non soldée');
    }

    // Référence unique
    const reference = `CERT-${new Date().getFullYear()}-${uuidv4().slice(0,8).toUpperCase()}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 50px; }
        h2 { text-align: center; }
        .ref { text-align: right; font-size: 12px; }
        .content { margin-top: 40px; font-size: 16px; }
        .footer { margin-top: 80px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="ref">Réf : ${reference}</div>
      <h2>CERTIFICAT DE SCOLARITÉ</h2>

      <div class="content">
        Nous certifions que <strong>${student.full_name}</strong>,
        matricule <strong>${student.matricule}</strong>,
        inscrit(e) en <strong>${student.class}</strong> (${student.level}),
        est régulièrement inscrit(e) pour l’année académique
        <strong>${student.academic_year}</strong>.
      </div>

      <div class="footer">
        <div>Fait à Yaoundé, le ${new Date().toLocaleDateString()}</div>
        <div>
          Le Directeur<br><br>
          ______________________
        </div>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();

    // Journalisation
    await db.query(
      `INSERT INTO certificates (matricule, reference, type)
       VALUES (?, ?, 'SCOLARITE')`,
      [student.matricule, reference]
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=certificat_${student.matricule}.pdf`
    });

    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur génération certificat');
  }
});

module.exports = router;
