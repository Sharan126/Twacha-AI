import base64
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

DISEASE_INFO = {
    "en": {
        "Eczema": {
            "severity": "Medium",
            "description": "Eczema is a condition that makes your skin red and itchy. It's common in children but can occur at any age.",
            "precautions": "Moisturize skin at least twice a day. Identify and avoid triggers that worsen the condition. Take shorter showers.",
            "doctor": "Dermatologist"
        },
        "Melanoma": {
            "severity": "High",
            "description": "Melanoma is a serious type of skin cancer that develops in the cells (melanocytes) that produce melanin.",
            "precautions": "Avoid sun exposure. Wear sunscreen year-round. This requires immediate medical attention and biopsy.",
            "doctor": "Oncologist / Dermatologist"
        },
        "Atopic Dermatitis": {
            "severity": "Medium",
            "description": "A chronic skin condition that flares periodically, causing dry, itchy, and inflamed skin.",
            "precautions": "Use gentle soaps. Apply cream right after bathing. Avoid scratching.",
            "doctor": "Dermatologist"
        },
        "BCC": {
            "severity": "High",
            "description": "Basal Cell Carcinoma (BCC) is a type of skin cancer that begins in the basal cells.",
            "precautions": "Avoid midday sun. Wear protective clothing. Seek medical removal immediately.",
            "doctor": "Dermatologist"
        },
        "Melanoma Nevi": {
            "severity": "Low",
            "description": "Also known as a mole. Usually harmless, but should be monitored for changes in size, shape, or color.",
            "precautions": "Monitor using the ABCDE rule. Protect from excessive sun.",
            "doctor": "General Physician / Dermatologist"
        },
        "BKL": {
            "severity": "Low",
            "description": "Benign Keratosis-like Lesions are non-cancerous skin growths that can look like warts or waxy bumps.",
            "precautions": "No immediate treatment required unless irritated or for cosmetic reasons.",
            "doctor": "Dermatologist"
        }
    },
    "kn": {
        "Eczema": {
            "severity": "ಮಧ್ಯಮ (Medium)",
            "description": "ಎಕ್ಸಿಮಾ ಚರ್ಮವನ್ನು ಕೆಂಪಾಗಿಸುವ ಮತ್ತು ತುರಿಕೆಯುಂಟುಮಾಡುವ ಸ್ಥಿತಿಯಾಗಿದೆ. ಇದು ಮಕ್ಕಳಲ್ಲಿ ಸಾಮಾನ್ಯ ಆದರೆ ಯಾವುದೇ ವಯಸ್ಸಿನಲ್ಲಿ ಬರಬಹುದು.",
            "precautions": "ದಿನಕ್ಕೆ ಕನಿಷ್ಠ ಎರಡು ಬಾರಿ ಚರ್ಮವನ್ನು ತೇವಗೊಳಿಸಿ. ಪ್ರಚೋದಕಗಳನ್ನು ತಪ್ಪಿಸಿ. ಕಡಿಮೆ ಸಮಯ ಸ್ನಾನ ಮಾಡಿ.",
            "doctor": "ಚರ್ಮರೋಗ ತಜ್ಞರು (Dermatologist)"
        },
        "Melanoma": {
            "severity": "ಹೆಚ್ಚು (High)",
            "description": "ಮೆಲನೋಮ ಗಂಭೀರ ರೀತಿಯ ಚರ್ಮದ ಕ್ಯಾನ್ಸರ್ ಆಗಿದೆ.",
            "precautions": "ಸೂರ್ಯನ ಬೆಳಕನ್ನು ತಪ್ಪಿಸಿ. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಗಮನ ಮತ್ತು ಬಯಾಪ್ಸಿ ಅಗತ್ಯವಿದೆ.",
            "doctor": "ಆಂಕೊಲಾಜಿಸ್ಟ್ / ಚರ್ಮರೋಗ ತಜ್ಞರು (Oncologist)"
        },
        "Atopic Dermatitis": {
            "severity": "ಮಧ್ಯಮ (Medium)",
            "description": "ಒಣ ಮತ್ತು ತುರಿಕೆಯ ಚರ್ಮಕ್ಕೆ ಕಾರಣವಾಗುವ ದೀರ್ಘಕಾಲದ ಚರ್ಮದ ಸ್ಥಿತಿ.",
            "precautions": "ಮೃದುವಾದ ಸಾಬೂನುಗಳನ್ನು ಬಳಸಿ. ಸ್ನಾನದ ನಂತರ ತಕ್ಷಣ ಕ್ರೀಮ್ ಹಚ್ಚಿ. ಸ್ಕ್ರಾಚಿಂಗ್ ತಪ್ಪಿಸಿ.",
            "doctor": "ಚರ್ಮರೋಗ ತಜ್ಞರು (Dermatologist)"
        },
        "BCC": {
            "severity": "ಹೆಚ್ಚು (High)",
            "description": "ತಳದ ಜೀವಕೋಶದ ಕಾರ್ಸಿನೋಮ (BCC) ಒಂದು ರೀತಿಯ ಚರ್ಮದ ಕ್ಯಾನ್ಸರ್.",
            "precautions": "ಸೂರ್ಯನ ಬಿಸಿಲನ್ನು ತಪ್ಪಿಸಿ. ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            "doctor": "ಚರ್ಮರೋಗ ತಜ್ಞರು (Dermatologist)"
        },
        "Melanoma Nevi": {
            "severity": "ಕಡಿಮೆ (Low)",
            "description": "ಸಾಮಾನ್ಯವಾಗಿ ಹಾನಿಕಾರಕವಲ್ಲ, ಆದರೆ ಗಾತ್ರ ಅಥವಾ ಬಣ್ಣದಲ್ಲಿನ ಬದಲಾವಣೆಗಳನ್ನು ಗಮನಿಸಬೇಕು.",
            "precautions": "ABCDE ನಿಯಮವನ್ನು ಬಳಸಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ. ಸೂರ್ಯನಿಂದ ರಕ್ಷಿಸಿಕೊಳ್ಳಿ.",
            "doctor": "ಸಾಮಾನ್ಯ ವೈದ್ಯರು / ಚರ್ಮರೋಗ ತಜ್ಞರು"
        },
        "BKL": {
            "severity": "ಕಡಿಮೆ (Low)",
            "description": "ಇವು ಕ್ಯಾನ್ಸರ್ ಅಲ್ಲದ ಚರ್ಮದ ಬೆಳವಣಿಗೆಗಳಾಗಿವೆ.",
            "precautions": "ಕಿರಿಕಿರಿಯಾಗದ ಹೊರತು ತುರ್ತು ಚಿಕಿತ್ಸೆಯ ಅಗತ್ಯವಿಲ್ಲ.",
            "doctor": "ಚರ್ಮರೋಗ ತಜ್ಞರು (Dermatologist)"
        }
    }
}

def generate_report(disease_class, lang="en"):
    """Returns a structured dictionary report for the disease."""
    db = DISEASE_INFO.get(lang) if lang in DISEASE_INFO else DISEASE_INFO["en"]
    return db.get(disease_class, {
        "severity": "Unknown",
        "description": "No specific description available." if lang == "en" else "ಯಾವುದೇ ನಿರ್ದಿಷ್ಟ ವಿವರಣೆ ಲಭ್ಯವಿಲ್ಲ.",
        "precautions": "Consult a medical professional." if lang == "en" else "ವೈದ್ಯಕೀಯ ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        "doctor": "Dermatologist" if lang == "en" else "ಚರ್ಮರೋಗ ತಜ್ಞರು"
    })

def generate_pdf(disease_class, confidence, report_dict):
    """Generates an English PDF report and returns it as a base64 encoded string."""
    # We always use the English report for the PDF because standard ReportLab fonts 
    # do not support Kannada Unicode out-of-the-box (it will show black boxes).
    db = DISEASE_INFO["en"]
    en_report = db.get(disease_class, {
        "severity": "Unknown",
        "description": "No specific description available.",
        "precautions": "Consult a medical professional.",
        "doctor": "Dermatologist"
    })

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    story = []
    
    story.append(Paragraph("Twacha AI - Skin Analysis Report", title_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph(f"<b>Predicted Condition:</b> {disease_class}", normal_style))
    story.append(Paragraph(f"<b>AI Confidence:</b> {confidence}%", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Description:</b>", styles['Heading3']))
    story.append(Paragraph(en_report['description'], normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Severity:</b>", styles['Heading3']))
    story.append(Paragraph(en_report['severity'], normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Precautions:</b>", styles['Heading3']))
    story.append(Paragraph(en_report['precautions'], normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Suggested Doctor:</b>", styles['Heading3']))
    story.append(Paragraph(en_report['doctor'], normal_style))
    story.append(Spacer(1, 24))
    
    disclaimer_style = ParagraphStyle('Disclaimer', parent=normal_style, textColor=colors.red)
    story.append(Paragraph("<b>DISCLAIMER:</b> This report is generated by an AI model and is not a professional medical diagnosis. Please consult a doctor.", disclaimer_style))
    
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return base64.b64encode(pdf_bytes).decode('utf-8')
