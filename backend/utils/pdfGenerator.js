// PDF Generator pour les documents officiels
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier pour les PDFs générés
const PDF_DIR = path.join(__dirname, '../generated_pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Fonction pour générer un certificat scolaire
const generateCertificate = async (studentData, outputStream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      // Pipe le document vers le stream de sortie
      doc.pipe(outputStream);

      // En-tête avec bordure élégante
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(3)
         .stroke('#2c3e50');

      doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70)
         .lineWidth(1)
         .stroke('#3498db');

      // Logo et nom de l'établissement
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .image(path.join(__dirname, '../assets/logo.png'), doc.page.width / 2 - 50, doc.y - 15, { width: 100 })
         .moveDown(2);

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text('BP 2701 Yaoundé, Cameroun', { align: 'center' })
         .text('Tél: +237 233 XX XX XX | Email: info@e-spputic.cm', { align: 'center' })
         .moveDown(0.5);

      // Ligne de séparation
      doc.moveTo(100, doc.y)
         .lineTo(doc.page.width - 100, doc.y)
         .lineWidth(2)
         .stroke('#3498db')
         .moveDown(3);

      // Titre du document
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('CERTIFICAT DE SCOLARITÉ', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#95a5a6')
         .text(`Année Académique: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, { align: 'center' })
         .moveDown(2);

      // Numéro du certificat
      const certNumber = `CERT-${studentData.matricule}-${Date.now()}`;
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(`N° ${certNumber}`, { align: 'center' })
         .moveDown(2);

      // Corps du certificat
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text('    Le Directeur  de l\'Ecole National Supérieure des Postes, Télécommunications et des Technologie de l\'Information et de la Communication  certifie que :', { align: 'left' })
         .moveDown(1.5);

      // Informations de l'étudiant dans un cadre
      const infoX = 100;
      const infoY = doc.y;
      const infoWidth = doc.page.width - 200;

      doc.rect(infoX - 10, infoY - 10, infoWidth + 20, 180)
         .fillAndStroke('#ecf0f1', '#bdc3c7');

      doc.fillColor('#2c3e50')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Nom et Prénom(s):', infoX, infoY)
         .font('Helvetica')
         .text(`${studentData.first_name} ${studentData.last_name}`, infoX + 150, infoY)
         .moveDown(0.4);

      doc.font('Helvetica-Bold')
         .text('Matricule:', infoX, doc.y)
         .font('Helvetica')
         .text(studentData.matricule, infoX + 150, doc.y)
         .moveDown(0.4);

      doc.font('Helvetica-Bold')
         .text('Classe:', infoX, doc.y)
         .font('Helvetica')
         .text(studentData.class_name || 'Non assigné', infoX + 150, doc.y)
         .moveDown(0.4);

      doc.font('Helvetica-Bold')
         .text('Niveau:', infoX, doc.y)
         .font('Helvetica')
         .text(studentData.level || 'N/A', infoX + 150, doc.y)
         .moveDown(0.4);

      doc.font('Helvetica-Bold')
         .text('Situation Financière:', infoX, doc.y)
         .font('Helvetica')
         .fillColor('#27ae60')
         .text(studentData.financial_status, infoX + 150, doc.y)
         .fillColor('#2c3e50')
         .moveDown(2);

      // Texte de certification
      doc.fontSize(12)
         .font('Helvetica')
         .text('Est régulièrement inscrit(e) dans notre établissement pour l\'année académique en cours et a satisfait à toutes les obligations financières.', infoX, doc.y)
         .moveDown(1);

      doc.text('Le présent certificat est délivré pour servir et valoir ce que de droit.', {
        width: doc.page.width - 140,
        align: 'left',
      })
      .font('Helvetica-Oblique')
      .moveDown(3);

      // Date et lieu
      const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.fontSize(11)
         .text(`Fait à Yaoundé, le ${today}`, { align: 'right' })
         .moveDown(1);

      // Signature
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Le Directeur', doc.page.width - 250, doc.y, { width: 200})
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#7f8c8d')
         .text('Signature et Cachet', doc.page.width - 250, doc.y, { width: 200, align: 'right' })
         .moveDown(2);

      // Ligne pour la signature
      doc.moveTo(doc.page.width - 250, doc.y)
         .lineTo(doc.page.width - 80, doc.y)
         .stroke('#95a5a6');

      // Pied de page
      doc.fontSize(8)
         .fillColor('#95a5a6')
         .text(
           'Ce document est un certificat officiel de SUPPTIC. Toute falsification est passible de poursuites judiciaires.',
           50,
           doc.page.height - 80,
           {
             width: doc.page.width - 100,
             align: 'center',
             lineGap: 3
           }
         );

      // QR Code placeholder (position pour futur QR code de vérification)
      doc.fontSize(7)
         .text(`Code de vérification: ${certNumber}`, {
           align: 'center'
         });

      // Finaliser le PDF
      doc.end();

      outputStream.on('finish', () => {
        resolve();
      });

      outputStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

// Fonction pour générer un relevé de notes (transcript)
const generateTranscript = async (studentData, grades, outputStream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      doc.pipe(outputStream);

      // En-tête
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(3)
         .stroke('#2c3e50');

      doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70)
         .lineWidth(1)
         .stroke('#3498db');

      // Logo et établissement
       doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .image(path.join(__dirname, '../assets/logo.png'), doc.page.width / 2 - 50, doc.y - 15, { width: 100 })
         .moveDown(2);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text('BP 2701 YAOUNDE, Cameroun', { align: 'center' })
         .moveDown(1.5);

      // Ligne de séparation
      doc.moveTo(80, doc.y)
         .lineTo(doc.page.width - 80, doc.y)
         .lineWidth(2)
         .stroke('#3498db')
         .moveDown(1.5);

      // Titre
      doc.fontSize(22)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('RELEVÉ DE NOTES', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#95a5a6')
         .text('TRANSCRIPT OF RECORDS', { align: 'center' })
         .moveDown(2);

      // Informations de l'étudiant
      const startY = doc.y;
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('Étudiant(e):', 60, startY);
      
      doc.font('Helvetica')
         .text(`${studentData.first_name} ${studentData.last_name}`, 180, startY);

      doc.font('Helvetica-Bold')
         .text('Matricule:', 60, doc.y + 5);
      
      doc.font('Helvetica')
         .text(studentData.matricule, 180, doc.y);

      doc.font('Helvetica-Bold')
         .text('Classe:', 60, doc.y + 5);
      
      doc.font('Helvetica')
         .text(studentData.class_name || 'Non assigné', 180, doc.y);

      doc.moveDown(2);

      // Tableau des notes
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text('Résultats Académiques', { align: 'left' })
         .moveDown(1);

      // En-têtes du tableau
      const tableTop = doc.y;
      const col1X = 60;
      const col2X = 200;
      const col3X = 330;
      const col4X = 410;
      const col5X = 490;

      // Fond d'en-tête
      doc.rect(col1X - 5, tableTop - 5, doc.page.width - 120, 25)
         .fillAndStroke('#3498db', '#2c3e50');

      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('Matière', col1X, tableTop)
         .text('Code', col2X, tableTop)
         .text('Type', col3X, tableTop)
         .text('Note', col4X, tableTop)
         .text('Période', col5X, tableTop);

      let y = tableTop + 30;

      // Vérifier s'il y a des notes
      if (!grades || grades.length === 0) {
        doc.fontSize(10)
           .font('Helvetica-Oblique')
           .fillColor('#7f8c8d')
           .text('Aucune note enregistrée', col1X, y, {
             width: doc.page.width - 120,
             align: 'center'
           });
        y += 30;
      } else {
        // Lignes du tableau
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#2c3e50');

        grades.forEach((grade, index) => {
          // Fond alterné pour les lignes
          if (index % 2 === 0) {
            doc.rect(col1X - 5, y - 5, doc.page.width - 120, 20)
               .fill('#f8f9fa');
          }

          // Couleur de la note selon le score
          let gradeColor = '#27ae60'; // Vert par défaut
          if (grade.grade < 50) gradeColor = '#e74c3c'; // Rouge
          else if (grade.grade < 70) gradeColor = '#f39c12'; // Orange

          doc.fillColor('#2c3e50')
             .text(grade.subject_name, col1X, y, { width: 130, ellipsis: true })
             .text(grade.subject_code, col2X, y)
             .text(grade.exam_type, col3X, y);

          doc.fillColor(gradeColor)
             .font('Helvetica-Bold')
             .text(grade.grade.toString(), col4X, y);

          doc.fillColor('#7f8c8d')
             .font('Helvetica')
             .fontSize(8)
             .text(`${grade.academic_year}`, col5X, y)
             .text(`${grade.semester}`, col5X, y + 10);

          y += 25;

          // Nouvelle page si nécessaire
          if (y > doc.page.height - 150) {
            doc.addPage();
            y = 80;
          }
        });

        // Calcul de la moyenne
        const average = (grades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / grades.length).toFixed(2);
        
        y += 10;
        doc.moveTo(col1X, y)
           .lineTo(doc.page.width - 60, y)
           .stroke('#bdc3c7');
        
        y += 15;
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#2c3e50')
           .text('Moyenne Générale:', col1X, y);
        
        const avgColor = average >= 70 ? '#27ae60' : average >= 50 ? '#f39c12' : '#e74c3c';
        doc.fillColor(avgColor)
           .fontSize(14)
           .text(`${average} / 100`, col3X, y);
      }

      // Date et signature
      y += 60;
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 80;
      }

      const today = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.fontSize(10)
         .fillColor('#2c3e50')
         .font('Helvetica')
         .text(`Fait à Douala, le ${today}`, 60, y);

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Le Directeur', doc.page.width - 220, y + 30);

      doc.moveTo(doc.page.width - 220, y + 70)
         .lineTo(doc.page.width - 80, y + 70)
         .stroke('#95a5a6');

      // Pied de page
      doc.fontSize(7)
         .fillColor('#95a5a6')
         .font('Helvetica')
         .text(
           'Document officiel - SUPPTIC',
           50,
           doc.page.height - 70,
           {
             width: doc.page.width - 100,
             align: 'center'
           }
         );

      doc.end();

      outputStream.on('finish', () => {
        resolve();
      });

      outputStream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificate,
  generateTranscript,
  PDF_DIR
};