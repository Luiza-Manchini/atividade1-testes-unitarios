import { HttpError } from "../../../src/errors";
import {
  type Enrollment,
  type EnrollmentRepository,
} from "../../../src/modules/enrollments/enrollments.repository";
import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";

async function expectHttpError(
  operation: Promise<unknown>,
  statusCode: number,
): Promise<void> {
  let thrown: unknown;

  try {
    await operation;
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(HttpError);
  expect(thrown).toMatchObject({ statusCode });
}

function createRepositoryMock(): jest.Mocked<EnrollmentRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("EnrollmentsService", () => {
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new EnrollmentsService(repository);
  });

  test("cria uma matricula valida e encaminha os identificadores separados e em ordem", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2026-01-02T03:04:05.000Z"),
    };
    repository.create.mockResolvedValue(enrollment);

    const result = await service.create({ studentRa: 123, courseId: 1 });

    expect(result).toBe(enrollment);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test.each([
    ["RA do aluno igual a zero", { studentRa: 0, courseId: 1 }],
    ["ID da disciplina igual a zero", { studentRa: 123, courseId: 0 }],
  ])("rejeita %s com HttpError 400 sem chamar o repositorio", async (_label, input) => {
    await expectHttpError(service.create(input), 400);

    expect(repository.create).not.toHaveBeenCalled();
  });

  test("traduz referencia inexistente para HttpError 404", async () => {
    repository.create.mockRejectedValue({ code: "23503" });

    await expectHttpError(service.create({ studentRa: 123, courseId: 1 }), 404);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test("traduz matricula duplicada para HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expectHttpError(service.create({ studentRa: 123, courseId: 1 }), 409);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test("rejeita matricula inexistente com HttpError 404 e encaminha ambos os identificadores", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expectHttpError(service.findOne(123, 1), 404);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });

  test("propaga a mesma instancia de uma falha inesperada na criacao", async () => {
    const error = new Error("falha inesperada ao criar matricula");
    repository.create.mockRejectedValue(error);

    await expect(
      service.create({ studentRa: 123, courseId: 1 }),
    ).rejects.toBe(error);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(123, 1);
  });

  test("lista matriculas e chama findAll uma vez sem argumentos", async () => {
    const enrolledAt = new Date("2026-01-02T03:04:05.000Z");
    const enrollments: Enrollment[] = [
      { studentRa: 123, courseId: 1, enrolledAt },
      { studentRa: 456, courseId: 2, enrolledAt },
    ];
    repository.findAll.mockResolvedValue(enrollments);

    const result = await service.findAll();

    expect(result).toBe(enrollments);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("retorna uma matricula existente e encaminha ambos os identificadores", async () => {
    const enrollment: Enrollment = {
      studentRa: 123,
      courseId: 1,
      enrolledAt: new Date("2026-01-02T03:04:05.000Z"),
    };
    repository.findOne.mockResolvedValue(enrollment);

    const result = await service.findOne(123, 1);

    expect(result).toBe(enrollment);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123, 1);
  });
});
