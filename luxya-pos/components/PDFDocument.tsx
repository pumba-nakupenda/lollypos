'use client'

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  sideBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#FDE700',
  },
  container: {
    padding: 40,
    paddingLeft: 50,
    minHeight: '100%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 'auto',
  },
  docTypeContainer: {
    marginTop: 10,
    backgroundColor: '#1a1a1a',
    padding: '5 15',
    borderRadius: 2,
  },
  docTypeText: {
    color: '#FDE700',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  metaBox: {
    textAlign: 'right',
  },
  metaRef: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#999999',
    letterSpacing: 1,
  },
  addressSection: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 30,
  },
  addressCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#eeeeee',
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#aaaaaa',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  addressDetail: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    padding: '10 15',
    marginBottom: 10,
  },
  th: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    padding: '12 15',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  cellDesc: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  cellNormal: { fontSize: 10, color: '#444444' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 30,
  },
  summaryBox: {
    width: 250,
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 9, color: '#888888' },
  summaryValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
  },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  totalValue: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#000000' },

  // NOUVELLE SECTION SIGNATURE
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  signatureBox: {
    textAlign: 'center',
    width: 150,
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 40,
    color: '#1a1a1a',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 6,
    color: '#cccccc',
    textTransform: 'uppercase',
  },

  // FOOTER FIXE EN BAS
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 7,
    color: '#bbbbbb',
    lineHeight: 1.4,
  },
  cornerShape: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    backgroundColor: '#FDE700',
    opacity: 0.05,
    borderBottomLeftRadius: 100,
  }
});

export const PDFDocument = ({ saleData, docTitle }: { saleData: any, docTitle: string }) => {
  const formatPrice = (num: number) => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const totalTTC = Number(saleData.total_amount || saleData.totalAmount || 0);
  const withTva = saleData.with_tva !== false;
  const ht = withTva ? (totalTTC / 1.18) : totalTTC;
  const tva = totalTTC - ht;
  const paid = Number(saleData.paid_amount || 0);
  const rest = totalTTC - paid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sideBar} />
        <View style={styles.cornerShape} />
        
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Image src="/logo_black.png" style={styles.logo} />
              <View style={styles.docTypeContainer}>
                <Text style={styles.docTypeText}>{docTitle}</Text>
              </View>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaRef}>{saleData.invoice_number}</Text>
              <Text style={styles.metaLabel}>Référence Document</Text>
              <View style={{ marginTop: 15 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>
                  {new Date(saleData.created_at || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
                <Text style={styles.metaLabel}>Date d'émission</Text>
              </View>
            </View>
          </View>

          {/* ADRESSES */}
          <View style={styles.addressSection}>
            <View style={styles.addressCard}>
              <Text style={styles.sectionLabel}>Émetteur</Text>
              <Text style={styles.addressName}>LOLLY SAS</Text>
              <Text style={styles.addressDetail}>Fass delorme 13x22</Text>
              <Text style={styles.addressDetail}>Dakar, Sénégal</Text>
              <Text style={styles.addressDetail}>contact@lolly.sn</Text>
            </View>
            <View style={styles.addressCard}>
              <Text style={styles.sectionLabel}>Destinataire</Text>
              <Text style={styles.addressName}>{saleData.customer_name || 'Client Comptant'}</Text>
              <Text style={styles.addressDetail}>Sénégal</Text>
              {saleData.linked_doc_number && (
                <Text style={[styles.addressDetail, { marginTop: 5, fontFamily: 'Helvetica-Bold', color: '#000' }]}>
                  Réf. liée: {saleData.linked_doc_number}
                </Text>
              )}
            </View>
          </View>

          {/* TABLEAU */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Désignation des articles</Text>
              <Text style={[styles.th, styles.colQty]}>Qté</Text>
              <Text style={[styles.th, styles.colPrice]}>P.U</Text>
              <Text style={[styles.th, styles.colTotal]}>Montant</Text>
            </View>

            {saleData.items?.map((item: any, i: number) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.cellDesc, styles.colDesc]}>{item.name || `Article ${i+1}`}</Text>
                <Text style={[styles.cellNormal, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cellNormal, styles.colPrice]}>{formatPrice(Number(item.price))}</Text>
                <Text style={[styles.cellDesc, styles.colTotal]}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
          </View>

          {/* RÉSUMÉ */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Hors Taxes</Text>
                <Text style={styles.summaryValue}>{formatPrice(ht)} CFA</Text>
              </View>
              {withTva && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TVA (18%)</Text>
                  <Text style={styles.summaryValue}>{formatPrice(tva)} CFA</Text>
                </View>
              )}
              {paid > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Acompte versé</Text>
                  <Text style={[styles.summaryValue, { color: '#FF4D8D' }]}>- {formatPrice(paid)} CFA</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total TTC</Text>
                <Text style={styles.totalValue}>{rest > 0 ? formatPrice(rest) : '0'} CFA</Text>
              </View>
            </View>
          </View>

          {/* SIGNATURE & CACHET (SÉPARÉ) */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Cachet & Signature</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>Autorisé par LOLLY SAS</Text>
              </View>
            </View>
          </View>

          {/* FOOTER (FIXE EN BAS DE PAGE) */}
          <View style={styles.footer}>
            <View>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>LOLLY GROUP SÉNÉGAL</Text>
              <Text style={styles.footerText}>N.I.N.E.A : 009694945 2E5 • RCCM : SN.DKR.2022.B.30557</Text>
              <Text style={[styles.footerText, { color: '#1a1a1a', fontFamily: 'Helvetica-Bold' }]}>EC BANK : SN094 01005 101630134003 24</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 7, color: '#bbbbbb' }}>Document officiel généré numériquement</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
