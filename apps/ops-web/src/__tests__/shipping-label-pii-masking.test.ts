import { describe, expect, it } from 'vitest';
import { maskPhoneNumber as opsMaskPhone } from '../printing/shippingLabelPrint';
import { maskPhoneNumber as returnOpsMaskPhone } from '../printing/returnShippingLabelPrint';

describe('Shipping Label PII Masking Tests', () => {
  const testCases = [
    { input: '0987654321', expected: '0987 *** 321', desc: 'Standard 10-digit VN mobile' },
    { input: '0901234567', expected: '0901 *** 567', desc: 'Standard 10-digit starting with 090' },
    { input: '0389123456', expected: '0389 *** 456', desc: 'Standard 10-digit starting with 038' },
    { input: '0912.345.678', expected: '0912 *** 678', desc: 'Dotted phone number' },
    { input: '0912 345 678', expected: '0912 *** 678', desc: 'Space-delimited phone number' },
    { input: '+84987654321', expected: '+8498 *** 321', desc: 'International format with +' },
    { input: '+84 987 654 321', expected: '+8498 *** 321', desc: 'International format with spaces' },
    { input: '', expected: '', desc: 'Empty string returns empty' },
    { input: '   ', expected: '', desc: 'Whitespace string returns empty' },
    { input: null, expected: '', desc: 'Null returns empty' },
    { input: undefined, expected: '', desc: 'Undefined returns empty' },
    { input: '123', expected: '***', desc: 'Very short number returns ***' },
    { input: '12345', expected: '12***5', desc: '5-digit number masks middle digits' },
  ];

  it('correctly masks phone numbers in ops-web shipping label printer', () => {
    for (const { input, expected, desc } of testCases) {
      expect(opsMaskPhone(input), desc).toBe(expected);
    }
  });

  it('correctly masks phone numbers in ops-web return shipping label printer', () => {
    for (const { input, expected, desc } of testCases) {
      expect(returnOpsMaskPhone(input), desc).toBe(expected);
    }
  });

  it('ensures no full phone number is printed in the HTML output', () => {
    const rawSender = '0987654321';
    const rawReceiver = '0912345678';
    const maskedSender = opsMaskPhone(rawSender);
    const maskedReceiver = opsMaskPhone(rawReceiver);

    expect(maskedSender).not.toContain(rawSender);
    expect(maskedReceiver).not.toContain(rawReceiver);
    expect(maskedSender).toBe('0987 *** 321');
    expect(maskedReceiver).toBe('0912 *** 678');
  });
});
