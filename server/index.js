import express from 'express';
import cors from 'cors';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

/**
 * Text Wrapping Utility
 */
function wrapText(text, maxWidth, font, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const fontSize = 12;
        const titleSize = 24;
        const margin = 50;

        // Initial Page
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const contentWidth = width - 2 * margin;

        let cursorY = height - margin;

        // Draw Title
        page.drawText(title, {
            x: margin,
            y: cursorY - titleSize,
            size: titleSize,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        cursorY -= (titleSize + 40);

        // Process Body Text
        const paragraphs = body.split('\n');

        for (const p of paragraphs) {
            const cleanP = p.trim();
            if (!cleanP) {
                cursorY -= 15; // Empty line spacing
                continue;
            }

            const lines = wrapText(cleanP, contentWidth, font, fontSize);

            for (const line of lines) {
                // Check for page break
                if (cursorY < margin + 40) {
                    // Add page number footer before switching
                    page.drawText(`Page ${pdfDoc.getPageCount()}`, {
                        x: width / 2 - 20,
                        y: margin - 20,
                        size: 9,
                        font,
                        color: rgb(0.5, 0.5, 0.5),
                    });

                    page = pdfDoc.addPage();
                    cursorY = height - margin;
                }

                page.drawText(line, {
                    x: margin,
                    y: cursorY - fontSize,
                    size: fontSize,
                    font,
                    color: rgb(0.1, 0.1, 0.1),
                });
                cursorY -= (fontSize + 5);
            }
            cursorY -= 10; // Paragraph spacing
        }

        // Add final page number
        page.drawText(`Page ${pdfDoc.getPageCount()}`, {
            x: width / 2 - 20,
            y: margin - 20,
            size: 9,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=NexusAI_${Date.now()}.pdf`);
        res.send(Buffer.from(pdfBytes));

        console.log(`[PDF] Generated: ${title}`);
    } catch (error) {
        console.error('[PDF] Generation failed:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.listen(PORT, () => {
    console.log(`[Server] PDF Generator running on http://localhost:${PORT}`);
});
