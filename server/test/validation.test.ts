import { HttpError } from '../src/errors';
import { parseId, positiveInteger, validateBody, validateName } from '../src/validation';

function expectBadRequest(action: () => unknown): void {
  let thrown: unknown;

  try {
    action();
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(HttpError);
  expect(thrown).toMatchObject({ statusCode: 400 });
}

describe('positiveInteger', () => {
  test.each([1, 2147483647])('retorna o inteiro positivo permitido %p', (value) => {
    expect(positiveInteger(value, 'RA')).toBe(value);
  });

  test.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    2147483648,
    '123',
    null,
    undefined,
  ])('rejeita a entrada invalida %p com HttpError 400', (value) => {
    expectBadRequest(() => positiveInteger(value, 'RA'));
  });
});

describe('parseId', () => {
  test.each([
    ['1', 1],
    ['2147483647', 2147483647],
  ])('converte a string %p para o numero %p', (value, expected) => {
    expect(parseId(value, 'RA')).toBe(expected);
  });

  test.each(['1abc', '1.2', '1e2', '', '-1', '0', '2147483648', 123])(
    'rejeita a entrada invalida %p com HttpError 400',
    (value) => {
      expectBadRequest(() => parseId(value, 'RA'));
    },
  );
});

describe('validateName', () => {
  test.each(['Ana', 'a'.repeat(100)])('retorna o nome valido recebido (%p)', (value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each(['', 'ab', '   ', ' a ', 'a'.repeat(101), 123, null, undefined])(
    'rejeita o nome invalido %p com HttpError 400',
    (value) => {
      expectBadRequest(() => validateName(value));
    },
  );
});

describe('validateBody', () => {
  test('retorna a mesma referencia de um objeto congelado sem modifica-lo', () => {
    const body = Object.freeze({ name: 'Ana' });

    const result = validateBody(body);

    expect(result).toBe(body);
    expect(result).toEqual({ name: 'Ana' });
    expect(Object.isFrozen(body)).toBe(true);
  });

  test.each([null, undefined, [], 'Ana', 12])(
    'rejeita o corpo invalido %p com HttpError 400',
    (value) => {
      expectBadRequest(() => validateBody(value));
    },
  );

  test('aceita campos extras e retorna a mesma referencia sem alterar o objeto', () => {
    const body = { name: 'Ana', extra: true };
    const original = { ...body };

    const result = validateBody(body);

    expect(result).toBe(body);
    expect(body).toEqual(original);
  });
});
