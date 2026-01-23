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
    const ventaUSD = n(it.ventaUSD);
    const util = n(it.utilidad);

    let unitVenta = ventaUSD;
    if (ventaUSD === 0 && costoUSD > 0) {
        unitVenta = costoUSD / (1 - (util / 100));
    }

    return {
        ventaUnitFinal: unitVenta,
        totalVenta: unitVenta * qty
    };
};

export const generateMasterPlanPDF = async (data) => {
    const {
        sections,
        pdfSettings,
        clientName = "CLIENTE",
        projectName = "PROYECTO",
        logoUrl
    } = data;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

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

    // Load Logo
    const logoImg = new Image();
    logoImg.src = pdfLogoUrl || logoUrl || "/solifood-logo.png";
    logoImg.crossOrigin = "Anonymous";

    return new Promise((resolve) => {
        logoImg.onload = () => {
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

                try {
                    doc.addImage(logoImg, 'PNG', logoPos.x, logoPos.y + topMargin, logoPos.width, logoPos.height, undefined, 'FAST');
                } catch (e) { console.error("Logo PDF Draw Error", e); }
            };

            let tableData = [];
            let globalIdx = 1;
            let grandTotal = 0;

            sections.forEach((s, sIdx) => {
                const activeItems = (s.items || []).filter(it => it.activo);
                if (activeItems.length === 0) return;

                tableData.push([
                    { content: `MÓDULO ${sIdx + 1}: ${s.titulo}`, colSpan: 7, styles: { fillColor: [120, 120, 120], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', minCellHeight: 10 } }
                ]);

                let modSum = 0;
                activeItems.forEach(it => {
                    const r = calcItem(it);
                    modSum += r.totalVenta;
                    grandTotal += r.totalVenta;
                    tableData.push([
                        { content: globalIdx++, styles: { textColor: settings.primaryColor || '#facc15', fontStyle: 'bold' } },
                        it.equipo.toUpperCase(),
                        it.descripcion.substring(0, 350),
                        { content: "", image: it.media_url && it.media_type !== 'video' ? it.media_url : null },
                        it.qty,
                        formatMoney(r.ventaUnitFinal),
                        formatMoney(r.totalVenta)
                    ]);
                });

                tableData.push([
                    { content: `SUBTOTAL MÓDULO ${sIdx + 1}`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } },
                    { content: formatMoney(modSum), styles: { halign: 'right', fontStyle: 'bold', fontSize: fontSize + 2, textColor: [60, 60, 60] } }
                ]);
            });

            doc.autoTable({
                startY: 40,
                head: [['ITEM', 'EQUIPO', 'DESCRIPCIÓN', 'FOTO', 'QTY', 'UNITARIO', 'TOTAL']],
                body: tableData,
                theme: 'plain',
                headStyles: { fillColor: settings.primaryColor || '#facc15', textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 12 },
                styles: { fontSize, cellPadding: 2, valign: 'middle', lineWidth: 0.1, minCellHeight: rowHeight },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { fontStyle: 'bold', cellWidth: 45 },
                    2: { cellWidth: 85 },
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
                        const img = tableData[data.row.index]?.[3]?.image;
                        if (img) try { doc.addImage(img, 'JPEG', data.cell.x + (data.cell.width - imgSize) / 2, data.cell.y + 2, imgSize, imgSize, undefined, 'FAST'); } catch (e) { }
                    }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 8;
            if (finalY < 185) {
                const totalBoxWidth = 64;
                const tableRightPos = 282;
                doc.setFillColor(0, 0, 0);
                doc.rect(tableRightPos - totalBoxWidth, finalY, totalBoxWidth, 14, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.text("TOTAL GENERAL", tableRightPos - totalBoxWidth + 5, finalY + 9);
                doc.setFontSize(16);
                doc.text(formatMoney(grandTotal), tableRightPos - 5, finalY + 9, { align: 'right' });
            }

            doc.save(`${projectName.replace(/\s+/g, '_')}_MasterPlan.pdf`);
            resolve();
        };

        logoImg.onerror = () => {
            console.error("Failed to load logo for PDF. Starting without it.");
            start();
        };
    });
};
