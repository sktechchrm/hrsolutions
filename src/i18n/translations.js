/**
 * i18n/translations.js
 *
 * Only two things from here are read anywhere in the app:
 *  - the top-level appName / tagline / selectCalc strings (HomeScreen header)
 *  - the `apps` map (HomeScreen card labels), one entry per id in
 *    utils/constants.ts APPS
 *
 * Every calculator screen (Maternity, Final Settlement, Drive Share,
 * Wages Grid) and SupportScreen keep their own bn/en copy inline instead
 * of reading from here, so no calculator-specific keys belong in this
 * file. Previously this file carried ~20 unused per-calculator blocks
 * (deposit, zakat, inheritance, incometax, utility, emi, age, bmi,
 * calorie, vat, smv, garments, gsize, unit, and more) left over from
 * retired calculators; none of them were ever read by any component,
 * so they were removed rather than kept as inactive weight.
 */
export const translations = {
  bn: {
    appName: 'এইচআর স্মার্ট সলিউশনস',
    tagline: 'একটি অ্যাপেই সব স্মার্ট সমাধান',
    selectCalc: 'সমাধান বেছে নিন',
    apps: {
      maternity:       { label: 'মাতৃত্ব সুবিধা',  desc: 'শ্রম আইন অনুযায়ী হিসাব' },
      finalsettlement: { label: 'চূড়ান্ত পাওনা',   desc: 'নিষ্পত্তি ও ক্ষতিপূরণ' },
      call:            { label: 'ভিডিও কল',        desc: 'ব্রাউজার টু ব্রাউজার' },
      driveshare:      { label: 'ফাইল পাঠান',      desc: 'Google Drive-এ সরাসরি' },
      wagesgrid:       { label: 'ওয়েজেস গ্রিড',    desc: 'পারফরম্যান্স ভিত্তিক মজুরি বৃদ্ধি' },
    },
  },
  en: {
    appName: 'HR Smart Solutions',
    tagline: 'All Smart Solutions in One App',
    selectCalc: 'Select a Solution',
    apps: {
      maternity:       { label: 'Maternity Benefit', desc: 'Labour Law Calculation' },
      finalsettlement: { label: 'Final Settlement',  desc: 'Separation & Compensation' },
      call:            { label: 'Video Call',        desc: 'Browser to browser' },
      driveshare:      { label: 'Send File',         desc: 'Straight to Google Drive' },
      wagesgrid:       { label: 'Wages Grid',        desc: 'Performance-based increment' },
    },
  },
};
