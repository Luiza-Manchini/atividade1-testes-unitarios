import { HttpError } from "../../../src/errors";
import {
  type Student,
  type StudentRepository,
} from "../../../src/modules/students/students.repository";
import { StudentsService } from "../../../src/modules/students/students.service";

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

function createRepositoryMock(): jest.Mocked<StudentRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new StudentsService(repository);
  });

  test("cria um aluno valido e encaminha os dados ao repositorio", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    repository.create.mockResolvedValue(student);

    const result = await service.create({ ra: 123, name: "Ana" });

    expect(result).toBe(student);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
  });

  test("rejeita RA invalido com HttpError 400 sem chamar o repositorio", async () => {
    await expectHttpError(service.create({ ra: 0, name: "Ana" }), 400);

    expect(repository.create).not.toHaveBeenCalled();
  });

  test("traduz RA duplicado para HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expectHttpError(service.create({ ra: 123, name: "Ana" }), 409);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
  });

  test("rejeita aluno inexistente com HttpError 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expectHttpError(service.findOne(123), 404);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("propaga a mesma instancia de uma falha inesperada na criacao", async () => {
    const error = new Error("falha inesperada ao criar aluno");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(error);

    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  test("lista alunos e chama findAll uma vez sem argumentos", async () => {
    const students: Student[] = [
      { ra: 123, name: "Ana" },
      { ra: 456, name: "Bruno" },
    ];
    repository.findAll.mockResolvedValue(students);

    const result = await service.findAll();

    expect(result).toBe(students);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("retorna um aluno existente e encaminha o RA uma vez", async () => {
    const student: Student = { ra: 123, name: "Ana" };
    repository.findOne.mockResolvedValue(student);

    const result = await service.findOne(123);

    expect(result).toBe(student);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });
});
