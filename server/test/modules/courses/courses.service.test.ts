import { HttpError } from "../../../src/errors";
import {
  type Course,
  type CourseRepository,
} from "../../../src/modules/courses/courses.repository";
import { CoursesService } from "../../../src/modules/courses/courses.service";

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

function createRepositoryMock(): jest.Mocked<CourseRepository> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
}

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new CoursesService(repository);
  });

  test("cria uma disciplina valida e encaminha somente os dados esperados uma vez", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    repository.create.mockResolvedValue(course);

    const result = await service.create({ name: "Qualidade" });

    expect(result).toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test.each([
    ["corpo nulo", null],
    ["objeto sem nome", {}],
    ["nome curto", { name: "A" }],
  ])("rejeita %s com HttpError 400 sem chamar o repositorio", async (_label, input) => {
    await expectHttpError(service.create(input), 400);

    expect(repository.create).not.toHaveBeenCalled();
  });

  test("traduz nome duplicado para HttpError 409", async () => {
    repository.create.mockRejectedValue({ code: "23505" });

    await expectHttpError(service.create({ name: "Qualidade" }), 409);

    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
  });

  test("lista disciplinas usando um stub com resposta conhecida", async () => {
    const courses: Course[] = [
      { id: 1, name: "Arquitetura" },
      { id: 7, name: "Qualidade" },
    ];
    repository.findAll.mockResolvedValue(courses);

    const result = await service.findAll();

    expect(result).toBe(courses);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
    expect(repository.findAll).toHaveBeenCalledWith();
  });

  test("retorna uma disciplina existente e encaminha seu identificador", async () => {
    const course: Course = { id: 123, name: "Qualidade" };
    repository.findOne.mockResolvedValue(course);

    const result = await service.findOne(123);

    expect(result).toBe(course);
    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("rejeita disciplina inexistente com HttpError 404", async () => {
    repository.findOne.mockResolvedValue(undefined);

    await expectHttpError(service.findOne(123), 404);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("rejeita identificador invalido com HttpError 400 sem consultar o repositorio", async () => {
    await expectHttpError(service.findOne(0), 400);

    expect(repository.findOne).not.toHaveBeenCalled();
  });

  test("propaga a mesma instancia de uma falha inesperada ao criar", async () => {
    const error = new Error("falha inesperada ao criar disciplina");
    repository.create.mockRejectedValue(error);

    await expect(service.create({ name: "Qualidade" })).rejects.toBe(error);

    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  test("propaga a mesma instancia de uma falha inesperada ao listar", async () => {
    const error = new Error("falha inesperada ao listar disciplinas");
    repository.findAll.mockRejectedValue(error);

    await expect(service.findAll()).rejects.toBe(error);

    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });

  test("propaga a mesma instancia de uma falha inesperada ao buscar", async () => {
    const error = new Error("falha inesperada ao buscar disciplina");
    repository.findOne.mockRejectedValue(error);

    await expect(service.findOne(123)).rejects.toBe(error);

    expect(repository.findOne).toHaveBeenCalledTimes(1);
    expect(repository.findOne).toHaveBeenCalledWith(123);
  });

  test("observa com spy o findOne de um stub assincrono existente", async () => {
    const course: Course = { id: 1, name: "Qualidade" };
    const stub: CourseRepository = {
      async create(data) {
        return { id: 1, name: data.name };
      },
      async findAll() {
        return [course];
      },
      async findOne() {
        return course;
      },
    };
    const findOneSpy = jest.spyOn(stub, "findOne");
    const serviceWithSpy = new CoursesService(stub);

    const result = await serviceWithSpy.findOne(1);

    expect(result).toBe(course);
    expect(findOneSpy).toHaveBeenCalledTimes(1);
    expect(findOneSpy).toHaveBeenCalledWith(1);
  });

  test("descarta campos extras antes de chamar o repositorio", async () => {
    const course: Course = { id: 7, name: "Qualidade" };
    repository.create.mockResolvedValue(course);

    const result = await service.create({ name: "Qualidade", extra: true });

    expect(result).toBe(course);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
    expect(repository.create.mock.calls[0][0]).not.toHaveProperty("extra");
  });
});
