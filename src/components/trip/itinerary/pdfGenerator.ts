import dayjs from 'dayjs';
import i18n from 'i18next';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

import { compareItineraryLine } from './helper.ts';

import type { Activity, Lodging, Transportation, Trip, ItineraryLine } from '../../../types/trips.ts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// @ts-expect-error pdfmake fonts
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : (pdfFonts as any).vfs;

const PRIMARY_COLOR = '#228be6';
const SECONDARY_COLOR = '#2c3e50';
const TEXT_COLOR = '#495057';

const TRANSPORTATION_COLOR = '#1971c2'; // Mantine Blue 9
const LODGING_COLOR = '#2f9e44'; // Mantine Green 9
const ACTIVITY_COLOR = '#e67700'; // Mantine Orange 9

const getName = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj.name) return obj.name;
  return String(obj);
};

const formatTransportation = (transportation: Transportation): Content => {
  const metadata = transportation.metadata || {};
  const isRental = transportation.type === 'rental_car';

  if (isRental) {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: [
                    {
                      text: `${i18n.t('transportation_rental_car', 'Car Rental').toUpperCase()}: `,
                      bold: true,
                      color: TRANSPORTATION_COLOR,
                    },
                    { text: getName(metadata.rentalCompany) || i18n.t('unknown', 'Unknown') },
                  ],
                  margin: [0, 0, 0, 4],
                },
                {
                  columns: [
                    {
                      text: `${i18n.t('transportation_pickup', 'Pickup')}: ${dayjs(transportation.departureTime).format('lll')}`,
                      fontSize: 10,
                    },
                    {
                      text: `${i18n.t('transportation_drop_off', 'Drop Off')}: ${dayjs(transportation.arrivalTime).format('lll')}`,
                      fontSize: 10,
                    },
                  ],
                  margin: [0, 0, 0, 4],
                },
                transportation.origin
                  ? {
                      text: `${i18n.t('transportation_pickup_location', 'Pickup Location')}: ${getName(transportation.origin)}`,
                      fontSize: 9,
                      color: TEXT_COLOR,
                      margin: [0, 0, 0, 2],
                    }
                  : '',
                transportation.destination
                  ? {
                      text: `${i18n.t('transportation_dropOff_location', 'Drop Off Location')}: ${getName(transportation.destination)}`,
                      fontSize: 9,
                      color: TEXT_COLOR,
                      margin: [0, 0, 0, 2],
                    }
                  : '',
                metadata.reservation
                  ? {
                      text: `${i18n.t('transportation_confirmation_code', 'Confirmation Code')}: ${metadata.reservation}`,
                      fontSize: 9,
                      color: TEXT_COLOR,
                      margin: [0, 0, 0, 2],
                    }
                  : '',
                transportation.cost?.value
                  ? {
                      text: `${i18n.t('cost', 'Cost')}: ${transportation.cost.value} ${transportation.cost.currency}`,
                      fontSize: 9,
                      color: TEXT_COLOR,
                    }
                  : '',
              ],
              margin: [10, 8, 10, 8],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#e9ecef',
        vLineColor: () => '#e9ecef',
      },
      margin: [0, 8, 0, 8],
    };
  }

  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              {
                text: [
                  {
                    text: `${i18n.t('transportation_' + transportation.type, transportation.type).toUpperCase()}: `,
                    bold: true,
                    color: TRANSPORTATION_COLOR,
                  },
                  { text: `${getName(transportation.origin)} -> ${getName(transportation.destination)}` },
                ],
                margin: [0, 0, 0, 4],
              },
              {
                columns: [
                  {
                    text: `${i18n.t('transportation_departure_time', 'Departure')}: ${dayjs(transportation.departureTime).format('lll')}`,
                    fontSize: 10,
                  },
                  {
                    text: `${i18n.t('transportation_arrival_time', 'Arrival')}: ${dayjs(transportation.arrivalTime).format('lll')}`,
                    fontSize: 10,
                  },
                ],
                margin: [0, 0, 0, 4],
              },
              {
                columns: [
                  metadata.provider
                    ? {
                        text: `${i18n.t('transportation_provider', 'Provider')}: ${getName(metadata.provider)}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                  metadata.flightNumber
                    ? {
                        text: `${i18n.t('transportation_flight', 'Flight')}: ${metadata.flightNumber}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                  metadata.reservation
                    ? {
                        text: `${i18n.t('transportation_reservation', 'Reservation')}: ${metadata.reservation}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                  transportation.cost?.value
                    ? {
                        text: `${i18n.t('cost', 'Cost')}: ${transportation.cost.value} ${transportation.cost.currency}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                ],
              },
            ],
            margin: [10, 8, 10, 8],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#e9ecef',
      vLineColor: () => '#e9ecef',
    },
    margin: [0, 8, 0, 8],
  };
};

const formatLodging = (l: Lodging): Content => {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              {
                text: [
                  {
                    text: `${i18n.t('expense_category_lodging', 'Lodging').toUpperCase()}: `,
                    bold: true,
                    color: LODGING_COLOR,
                  },
                  { text: getName(l.name) },
                ],
                margin: [0, 0, 0, 4],
              },
              l.address
                ? {
                    text: `${i18n.t('address', 'Address')}: ${getName(l.address)}`,
                    fontSize: 9,
                    color: TEXT_COLOR,
                    margin: [0, 0, 0, 4],
                  }
                : '',
              {
                columns: [
                  {
                    text: `${i18n.t('lodging_check_in', 'Check-In')}: ${dayjs(l.startDate).format('lll')}`,
                    fontSize: 10,
                  },
                  {
                    text: `${i18n.t('lodging_check_out', 'Check-Out')}: ${dayjs(l.endDate).format('lll')}`,
                    fontSize: 10,
                  },
                ],
                margin: [0, 0, 0, 4],
              },
              {
                columns: [
                  l.confirmationCode
                    ? {
                        text: `${i18n.t('lodging_confirmation_code', 'Confirmation Code')}: ${l.confirmationCode}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                  l.cost?.value
                    ? {
                        text: `${i18n.t('cost', 'Cost')}: ${l.cost.value} ${l.cost.currency}`,
                        fontSize: 9,
                        color: TEXT_COLOR,
                      }
                    : '',
                ],
              },
            ],
            margin: [10, 8, 10, 8],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#e9ecef',
      vLineColor: () => '#e9ecef',
    },
    margin: [0, 8, 0, 8],
  };
};

const formatActivity = (a: Activity): Content => {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              {
                text: [
                  {
                    text: `${i18n.t('activity_label', 'Activity').toUpperCase()}: `,
                    bold: true,
                    color: ACTIVITY_COLOR,
                  },
                  { text: getName(a.name) },
                ],
                margin: [0, 0, 0, 4],
              },
              a.description ? { text: a.description, fontSize: 9, margin: [0, 0, 0, 4] } : '',
              a.address
                ? {
                    text: `${i18n.t('location', 'Location')}: ${getName(a.address)}`,
                    fontSize: 9,
                    color: TEXT_COLOR,
                    margin: [0, 0, 0, 4],
                  }
                : '',
              {
                columns: [
                  { text: `${i18n.t('time', 'Time')}: ${dayjs(a.startDate).format('lll')}`, fontSize: 10 },
                  a.cost?.value
                    ? {
                        text: `${i18n.t('cost', 'Cost')}: ${a.cost.value} ${a.cost.currency}`,
                        fontSize: 10,
                      }
                    : '',
                ],
              },
            ],
            margin: [10, 8, 10, 8],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#e9ecef',
      vLineColor: () => '#e9ecef',
    },
    margin: [0, 8, 0, 8],
  };
};

const formatItineraryLine = (line: ItineraryLine): Content => {
  switch (line.itineraryType) {
    case 'transportation':
      return formatTransportation(line as Transportation);
    case 'lodging':
      return formatLodging(line as Lodging);
    case 'activity':
      return formatActivity(line as Activity);
    default:
      return '';
  }
};

const htmlToPdfMake = (html: string): Content[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const parseNodes = (nodes: NodeList): Content[] => {
    const content: Content[] = [];

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) {
          content.push({ text: node.textContent });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const nodeName = element.nodeName.toLowerCase();

        switch (nodeName) {
          case 'p':
            content.push({ text: parseNodes(element.childNodes), margin: [0, 5, 0, 5] });
            break;
          case 'b':
          case 'strong':
            content.push({ text: parseNodes(element.childNodes), bold: true });
            break;
          case 'i':
          case 'em':
            content.push({ text: parseNodes(element.childNodes), italics: true });
            break;
          case 'u':
            content.push({ text: parseNodes(element.childNodes), decoration: 'underline' });
            break;
          case 'a':
            content.push({
              text: parseNodes(element.childNodes),
              link: element.getAttribute('href') || '',
              color: PRIMARY_COLOR,
              decoration: 'underline',
            });
            break;
          case 'h1':
            content.push({ text: parseNodes(element.childNodes), fontSize: 20, bold: true, margin: [0, 10, 0, 5] });
            break;
          case 'h2':
            content.push({ text: parseNodes(element.childNodes), fontSize: 18, bold: true, margin: [0, 8, 0, 4] });
            break;
          case 'h3':
            content.push({ text: parseNodes(element.childNodes), fontSize: 16, bold: true, margin: [0, 6, 0, 3] });
            break;
          case 'h4':
            content.push({ text: parseNodes(element.childNodes), fontSize: 14, bold: true, margin: [0, 4, 0, 2] });
            break;
          case 'ul':
            content.push({ ul: parseNodes(element.childNodes).filter((c) => (c as any).text || (c as any).stack) });
            break;
          case 'ol':
            content.push({ ol: parseNodes(element.childNodes).filter((c) => (c as any).text || (c as any).stack) });
            break;
          case 'li':
            content.push({ stack: parseNodes(element.childNodes) });
            break;
          case 'img':
            if (element.getAttribute('src')) {
              content.push({
                image: element.getAttribute('src') as string,
                width: 400,
                margin: [0, 5, 0, 5],
              });
            }
            break;
          case 'table':
            {
              const rows: any[][] = [];
              element.querySelectorAll('tr').forEach((tr) => {
                const row: any[] = [];
                tr.querySelectorAll('td, th').forEach((cell) => {
                  row.push({
                    stack: parseNodes(cell.childNodes),
                    bold: cell.nodeName.toLowerCase() === 'th',
                    fillColor: cell.nodeName.toLowerCase() === 'th' ? '#f8f9fa' : undefined,
                  });
                });
                if (row.length > 0) {
                  rows.push(row);
                }
              });
              if (rows.length > 0) {
                content.push({
                  table: {
                    body: rows,
                  },
                  margin: [0, 5, 0, 5],
                });
              }
            }
            break;
          case 'br':
            content.push({ text: '\n' });
            break;
          default:
            content.push(...parseNodes(element.childNodes));
        }
      }
    });

    return content;
  };

  return parseNodes(doc.body.childNodes);
};

export const downloadFullItinerary = (
  trip: Trip,
  transportations: Transportation[],
  lodgings: Lodging[],
  activities: Activity[]
) => {
  dayjs.locale(i18n.language);
  const allEvents: ItineraryLine[] = [
    ...transportations.map((t) => ({ ...t, itineraryType: 'transportation', day: dayjs(t.departureTime) })),
    ...lodgings.map((l) => ({ ...l, itineraryType: 'lodging', day: dayjs(l.startDate) })),
    ...activities.map((a) => ({ ...a, itineraryType: 'activity', day: dayjs(a.startDate) })),
  ];

  allEvents.sort(compareItineraryLine);

  const content: Content[] = [
    { text: trip.name, style: 'header' },
    { text: trip.description || '', style: 'subheader' },
    { text: `${dayjs(trip.startDate).format('ll')} - ${dayjs(trip.endDate).format('ll')}`, margin: [0, 0, 0, 10] },
  ];

  if (trip.destinations && trip.destinations.length > 0) {
    content.push({ text: i18n.t('destinations', 'Destinations'), style: 'sectionHeader' });
    content.push({
      ul: trip.destinations.map((d) => getName(d)),
      margin: [0, 0, 0, 10],
    });
  }

  if (trip.participants && trip.participants.length > 0) {
    content.push({ text: i18n.t('trip_travellers', 'Travelers'), style: 'sectionHeader' });
    content.push({
      text: trip.participants.map((p) => getName(p)).join(', '),
      margin: [0, 0, 0, 10],
    });
  }

  content.push({ text: i18n.t('itinerary_full', 'Full Itinerary'), style: 'sectionHeader' });

  allEvents.forEach((event) => {
    content.push(formatItineraryLine(event));
  });

  if (trip.notes) {
    content.push({ text: i18n.t('trip_notes', 'Notes'), style: 'sectionHeader', pageBreak: 'before' });
    content.push(...htmlToPdfMake(trip.notes));
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 24, bold: true, margin: [0, 0, 0, 10], color: PRIMARY_COLOR },
      subheader: { fontSize: 16, italics: true, margin: [0, 0, 0, 10], color: SECONDARY_COLOR },
      sectionHeader: { fontSize: 18, bold: true, margin: [0, 15, 0, 10], color: SECONDARY_COLOR },
    },
    defaultStyle: {
      color: TEXT_COLOR,
      lineHeight: 1.2,
    },
  };

  const fileName = `${trip.name}_${i18n.t('itinerary_full', 'Full Itinerary').replace(/ /g, '_')}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
};

export const downloadDailyItinerary = (
  trip: Trip,
  transportations: Transportation[],
  lodgings: Lodging[],
  activities: Activity[]
) => {
  dayjs.locale(i18n.language);
  const tripStart = dayjs(trip.startDate).startOf('day');
  const tripEnd = dayjs(trip.endDate).endOf('day');

  const content: Content[] = [
    { text: trip.name, style: 'header' },
    { text: trip.description || '', style: 'subheader' },
    { text: `${dayjs(trip.startDate).format('ll')} - ${dayjs(trip.endDate).format('ll')}`, margin: [0, 0, 0, 20] },
    { text: i18n.t('itinerary_daily', 'Daily Itinerary'), style: 'sectionHeader' },
  ];

  let dayCount = 0;
  for (let m = dayjs(tripStart); m.isBefore(tripEnd) || m.isSame(tripEnd, 'day'); m = m.add(1, 'day')) {
    const dailyEvents: ItineraryLine[] = [];
    const dayStart = m.startOf('day');
    const dayEnd = m.endOf('day');

    transportations.forEach((t) => {
      const tStart = dayjs(t.departureTime);
      const tEnd = dayjs(t.arrivalTime);
      if (
        tStart.isSame(dayStart, 'day') ||
        tEnd.isSame(dayStart, 'day') ||
        (tStart.isBefore(dayStart) && tEnd.isAfter(dayEnd))
      ) {
        dailyEvents.push({ ...t, itineraryType: 'transportation', day: m });
      }
    });

    lodgings.forEach((l) => {
      const lStart = dayjs(l.startDate);
      const lEnd = dayjs(l.endDate);
      if (
        lStart.isSame(dayStart, 'day') ||
        lEnd.isSame(dayStart, 'day') ||
        (lStart.isBefore(dayStart) && lEnd.isAfter(dayEnd))
      ) {
        dailyEvents.push({ ...l, itineraryType: 'lodging', day: m });
      }
    });

    activities.forEach((a) => {
      const aStart = dayjs(a.startDate);
      if (aStart.isSame(dayStart, 'day')) {
        dailyEvents.push({ ...a, itineraryType: 'activity', day: m });
      }
    });

    if (dailyEvents.length > 0) {
      dayCount++;
      dailyEvents.sort(compareItineraryLine);
      content.push({
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: `${m.format('dddd, LL')}`,
                style: 'dayHeader',
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f0f7ff' : null),
        },
        margin: [0, 20, 0, 12],
        pageBreak: dayCount > 1 ? 'before' : undefined,
      });

      dailyEvents.forEach((event) => {
        content.push(formatItineraryLine(event));
      });
    }
  }

  if (trip.notes) {
    content.push({ text: i18n.t('trip_notes', 'Notes'), style: 'sectionHeader', pageBreak: 'before' });
    content.push(...htmlToPdfMake(trip.notes));
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: { fontSize: 24, bold: true, margin: [0, 0, 0, 10], color: PRIMARY_COLOR },
      subheader: { fontSize: 16, italics: true, margin: [0, 0, 0, 10], color: SECONDARY_COLOR },
      sectionHeader: { fontSize: 18, bold: true, margin: [0, 15, 0, 10], color: SECONDARY_COLOR },
      dayHeader: { fontSize: 16, bold: true, color: PRIMARY_COLOR, margin: [5, 5, 5, 5] },
    },
    defaultStyle: {
      color: TEXT_COLOR,
      lineHeight: 1.2,
    },
  };

  const fileName = `${trip.name}_${i18n.t('itinerary_daily', 'Daily Itinerary').replace(/ /g, '_')}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
};
