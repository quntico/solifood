import jsPDF from 'jspdf';
import 'jspdf-autotable';

const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
};

const formatMoney = (v) =>
    v.toLocaleString("en-US", { style: "currency", currency: "USD" });

const calcItem = (it) => {
    const qty = n(it.qty);
    const costoUSD = n(it.costoUSD);
    const util = n(it.utilidad);

    // UNIFIED CALCULATION LOGIC (Ver 5.63) - MUST MATCH MasterPlan.jsx Markup Formula
    const ventaUnitFinal = costoUSD * (1 + (util / 100));

    return {
        ventaUnitFinal: ventaUnitFinal,
        totalVenta: ventaUnitFinal * qty
    };
};

const loadImageAsDataURL = (url, format = 'JPEG', timeout = 3000) => new Promise((resolve) => {
    if (!url || url.includes('placeholder')) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";

    const timer = setTimeout(() => {
        img.src = "";
        console.warn("Image timeout:", url);
        resolve(null);
    }, timeout);

    img.src = url;
    img.onload = () => {
        clearTimeout(timer);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (format === 'JPEG') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, format === 'PNG' ? undefined : 0.85);
            resolve(dataUrl);
        } catch (e) {
            console.error("Canvas convert error", e);
            resolve(null);
        }
    };
    img.onerror = () => {
        clearTimeout(timer);
        console.warn("Failed to load image:", url);
        resolve(null);
    };
});

export const generateMasterPlanPDF = async (data) => {
    const {
        sections,
        pdfSettings,
        clientName = "CLIENTE",
        projectName = "PROYECTO",
        logoUrl
    } = data;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const settings = pdfSettings || {
        primaryColor: '#facc15',
        secondaryColor: '#000000',
        headerBg: '#facc15',
        headerText: '#000000',
        titleText: 'CONCENTRADO',
        logoPos: { x: 235, y: 0, width: 45, height: 25 },
        headerBox: { x: 15, y: 0, width: 95, height: 15 },
        metaPos: { x: 120, y: 3 },
        colWidths: { item: 15, equipo: 45, desc: 85, foto: 35, qty: 15, unit: 32, total: 32 },
        fontSize: 9,
        rowHeight: 25,
        showImages: true,
        imgSize: 18,
    };

    const {
        headerBg, headerText, titleText, logoPos,
        colWidths, fontSize, rowHeight, imgSize,
        metaPos, headerBox, logoUrl: pdfLogoUrl
    } = settings;

    // 1. COLLECT ALL URLS (Logo + unique item images)
    const itemUrls = [...new Set(
        sections.flatMap(s => (s.items || [])
            .filter(it => it.activo && it.media_url && it.media_type !== 'video')
            .map(it => it.media_url))
    )];

    const mainLogoUrl = pdfLogoUrl || logoUrl || "/solifood-logo.png";

    // 2. PARALLEL LOAD ALL IMAGES
    const [loadedLogo, ...loadedItemImages] = await Promise.all([
        loadImageAsDataURL(mainLogoUrl, 'PNG'),
        ...itemUrls.map(u => loadImageAsDataURL(u, 'JPEG'))
    ]);

    const imageMap = new Map(itemUrls.map((url, i) => [url, loadedItemImages[i]]));

    const topMargin = 8;
    const drawHeader = () => {
        doc.setFillColor(headerBg);
        doc.rect(headerBox.x, headerBox.y + topMargin, headerBox.width, headerBox.height, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(headerText);
        doc.text(titleText, headerBox.x + (headerBox.width / 2), headerBox.y + topMargin + (headerBox.height / 2) + 4, { align: 'center' });

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CLIENTE:", metaPos.x, metaPos.y + topMargin);
        doc.setFont("helvetica", "normal");
        doc.text(clientName.toUpperCase(), metaPos.x + 23, metaPos.y + topMargin);
        doc.setFont("helvetica", "bold");
        doc.text("PROYECTO:", metaPos.x, metaPos.y + topMargin + 5);
        doc.setFont("helvetica", "normal");
        doc.text(projectName.toUpperCase(), metaPos.x + 23, metaPos.y + topMargin + 5);
        doc.setFont("helvetica", "bold");
        doc.text("FECHA:", metaPos.x, metaPos.y + topMargin + 10);
        doc.setFont("helvetica", "normal");
        doc.text(new Date().toLocaleDateString('es-MX'), metaPos.x + 23, metaPos.y + topMargin + 10);

        if (loadedLogo) {
            try {
                doc.addImage(loadedLogo, 'PNG', logoPos.x, logoPos.y + topMargin, logoPos.width, logoPos.height, undefined, 'FAST');
            } catch (e) { console.error("Logo PDF Draw Error", e); }
        }
    };

    let globalIdx = 1;
    let grandTotal = 0;
    let firstSectionDrawn = false;

    sections.forEach((s, sIdx) => {
        const activeItems = (s.items || []).filter(it => it.activo);
        if (activeItems.length === 0) return;

        if (firstSectionDrawn) {
            doc.addPage();
        }
        firstSectionDrawn = true;

        const sectionTableData = [];
        sectionTableData.push([
            { content: `MÓDULO ${sIdx + 1}: ${s.titulo}`, colSpan: 7, styles: { fillColor: [120, 120, 120], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', minCellHeight: 10 } }
        ]);

        let modSum = 0;
        activeItems.forEach(it => {
            const r = calcItem(it);
            modSum += r.totalVenta;
            grandTotal += r.totalVenta;

            // Get preloaded image
            const imgObj = it.media_url ? imageMap.get(it.media_url) : null;

            sectionTableData.push([
                { content: globalIdx++, styles: { textColor: settings.primaryColor || '#facc15', fontStyle: 'bold' } },
                it.equipo.toUpperCase(),
                it.descripcion,
                { content: "", image: imgObj },
                it.qty,
                formatMoney(r.ventaUnitFinal),
                formatMoney(r.totalVenta)
            ]);
        });

        sectionTableData.push([
            { content: `SUBTOTAL MÓDULO ${sIdx + 1}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } },
            { content: formatMoney(modSum), colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } }
        ]);

        doc.autoTable({
            startY: 40,
            head: [['ITEM', 'EQUIPO', 'DESCRIPCIÓN', 'FOTO', 'QTY', 'UNITARIO', 'TOTAL']],
            body: sectionTableData,
            theme: 'plain',
            headStyles: { fillColor: settings.primaryColor || '#facc15', textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 12 },
            styles: { fontSize, cellPadding: 2, valign: 'middle', lineWidth: 0.1, minCellHeight: rowHeight },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { fontStyle: 'bold', cellWidth: 45 },
                2: { cellWidth: 85, cellPadding: { top: 3, right: 3, bottom: 6, left: 3 } },
                3: { halign: 'center', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 15 },
                5: { halign: 'right', cellWidth: 32 },
                6: { halign: 'right', cellWidth: 32 }
            },
            rowPageBreak: 'avoid',
            margin: { top: 40, left: 15, right: 15, bottom: 20 },
            didDrawPage: (data) => {
                drawHeader();
                doc.setFontSize(7);
                doc.setTextColor(180, 180, 180);
                doc.text(`Página ${data.pageNumber} | www.solifood.mx`, 282, 202, { align: 'right' });
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 3) {
                    const imgObj = sectionTableData[data.row.index]?.[3]?.image;
                    if (imgObj) {
                        try {
                            doc.addImage(imgObj, 'JPEG', data.cell.x + (data.cell.width - imgSize) / 2, data.cell.y + 2, imgSize, imgSize, undefined, 'FAST');
                        } catch (e) {
                            console.error("Error adding item image to PDF", e);
                        }
                    }
                }
            }
        });
    });

    // Add a new page for the summary
    doc.addPage();
    drawHeader();
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DE INVERSIÓN TOTAL", 15, 45);
    doc.setDrawColor(settings.primaryColor || '#facc15');
    doc.setLineWidth(1.5);
    doc.line(15, 48, 110, 48);

    const summaryData = [];
    let grandTotalKw = 0;
    sections.forEach((s, sIdx) => {
        const activeItems = (s.items || []).filter(it => it.activo);
        if (activeItems.length === 0) return;

        let modSum = 0;
        let modKw = 0;
        activeItems.forEach(it => {
            const r = calcItem(it);
            modSum += r.totalVenta;
            modKw += parseKw(it.kw) * (it.qty || 1);
        });

        grandTotalKw += modKw;

        summaryData.push([
            { content: `MÓDULO ${sIdx + 1}: ${s.titulo}`, styles: { fontStyle: 'bold' } },
            { content: `${formatMoney(modSum)} ${isMXN ? 'MXN' : 'USD'}`, styles: { halign: 'right', fontStyle: 'bold' } }
        ]);
    });

    doc.autoTable({
        startY: 52,
        head: [['MÓDULO DEL PROYECTO', 'MONTO']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: settings.primaryColor || '#facc15', textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 9, fontSize: 10, lineColor: settings.primaryColor || '#facc15', lineWidth: 0.1 },
        styles: { fontSize: 9, cellPadding: 2.5, valign: 'middle', textColor: [40, 40, 40], lineColor: [220, 220, 220], lineWidth: 0.1, minCellHeight: 8 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
            0: { cellWidth: 197 },
            1: { cellWidth: 70, halign: 'right' }
        },
        margin: { top: 40, left: 15, right: 15, bottom: 20 },
        didDrawPage: (data) => {
            drawHeader();
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text(`Resumen | Página ${data.pageNumber} | www.solifood.mx`, 282, 202, { align: 'right' });
        }
    });

    let finalY = doc.lastAutoTable.finalY + 6;
    if (finalY > 180) {
        doc.addPage();
        drawHeader();
        finalY = 40;
    }

    const totalBoxWidth = 180;
    const tableRightPos = 282;
    const boxHeight = grandTotalKw > 0 ? 24 : 14;
    doc.setFillColor(89, 89, 89);
    doc.rect(tableRightPos - totalBoxWidth, finalY, totalBoxWidth, boxHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`TOTAL DEL PROYECTO (${isMXN ? 'MXN' : 'USD'})`, tableRightPos - totalBoxWidth + 5, finalY + 6);
    doc.setFontSize(7);
    doc.setTextColor(220, 220, 220);
    doc.text("* precios más 16% de I.V.A.", tableRightPos - totalBoxWidth + 5, finalY + 11);

    doc.setFontSize(18);
    doc.setTextColor(settings.primaryColor || '#facc15');
    doc.text(`${formatMoney(grandTotal)} ${isMXN ? 'MXN' : 'USD'}`, tableRightPos - 4, finalY + 10, { align: 'right' });

    if (grandTotalKw > 0) {
        doc.setFontSize(7);
        doc.setTextColor(200, 200, 200);
        doc.text(`CAPACIDAD INSTALADA: ${grandTotalKw.toFixed(2)} kW`, tableRightPos - 4, finalY + 17, { align: 'right' });
        doc.text(`CONSUMO NOMINAL: ${(grandTotalKw * 0.75).toFixed(2)} kW`, tableRightPos - 4, finalY + 21, { align: 'right' });
    }

    doc.save(`${projectName.replace(/\s+/g, '_')}_MasterPlan.pdf`);
};
