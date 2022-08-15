export type Documentation = string;

export interface XRef {
  fqname: string;
  project?: string;
}

export interface Typ {
  name: string;
  xref?: XRef;
  params?: Array<Typ>;
}

export interface Export {
  name: string;
  xref: XRef;
}

export interface Variable {
  name: string;
  type?: Typ;
  documentation: Array<Documentation>;
}

export interface Param {
  name: string;
  type: Typ | null;
  default: string | null;
}

export interface Func {
  name: string;
  asynchronous: boolean;
  params: Array<Param>;
  returns: Typ | null;
  documentation: Array<Documentation>;
}

// Can't provide a default type for C because it'd be recursive due to inner_classes, so we need this trickery
export interface _Class<C extends _Class<C>> {
  name: string;
  bases: Array<string>;
  methods: Array<Func>;
  class_variables: Array<Variable>;
  instance_variables: Array<Variable>;
  inner_classes: Array<C>;
  documentation: Array<Documentation>;
}

export type Class = _Class<Class>;

export interface Module<C extends _Class<C> = Class> {
  name: string;
  documentation: Array<Documentation>;
  functions: Array<Func>;
  variables: Array<Variable>;
  classes: Array<C>;
  exports: Array<string>;
}

export interface ProjectMetadata {
  version: string;
  classifiers?: Array<string>;
  home_page?: string;
  license?: string;
  documentation_url?: string;
  dependencies: Array<string>;
  summary?: string;
}

export interface Project<
  C extends _Class<C> = Class,
  M extends Module<C> = Module<C>
> {
  name: string;
  metadata: ProjectMetadata;
  documentation: Array<Documentation>;
  modules: Array<M>;
}

export class RichProject implements Project<RichClass, RichModule> {
  name: string;
  metadata: ProjectMetadata;
  documentation: Array<Documentation>;
  modules: Array<RichModule>;

  constructor(p: Project) {
    this.name = p.name;
    this.metadata = p.metadata;
    this.documentation = p.documentation;
    this.modules = p.modules.map((m) => new RichModule(m, this));
  }
}

export class RichModule implements Module<RichClass> {
  // Module<RichClass>
  name: string;
  documentation: string[];
  functions: Func[];
  variables: Variable[];
  classes: RichClass[];
  exports: string[];

  // RichModule
  project: RichProject;

  constructor(m: Module, p: RichProject) {
    this.name = m.name;
    this.project = p;
    this.documentation = m.documentation;
    this.functions = m.functions;
    this.variables = m.variables;
    this.classes = m.classes.map((c) => new RichClass(c, this));
    this.exports = m.exports;
  }
}

export class RichClass implements _Class<RichClass> {
  // _Class<RichClass>
  name: string;
  bases: string[];
  methods: Func[];
  class_variables: Variable[];
  instance_variables: Variable[];
  inner_classes: RichClass[];
  documentation: string[];

  // RichClass
  module: RichModule;
  outer_class: RichClass | undefined;

  constructor(c: Class, m: RichModule, o: RichClass | undefined = undefined) {
    this.name = c.name;
    this.module = m;
    this.bases = c.bases;
    this.methods = c.methods;
    this.class_variables = c.class_variables;
    this.instance_variables = c.instance_variables;
    this.inner_classes = c.inner_classes.map(
      (ic) => new RichClass(ic, m, this)
    );
    this.documentation = c.documentation;
    this.outer_class = o;
  }
}
