# Requirements

## Navigation

---

- [Requirements](#requirements)
  - [Navigation](#navigation)
  - [Deutsch](#deutsch)
    - [Einleitung](#einleitung)
    - [Anforderungen](#anforderungen)
      - [Person](#person)
      - [Verbindungen](#verbindungen)
      - [Familien](#familien)
      - [Daten zu Personen](#daten-zu-personen)
      - [Zugriffsrechte](#zugriffsrechte)
  - [English](#english)
    - [Introduction](#introduction)
    - [Requirement](#requirement)
      - [Persons](#persons)
      - [Links](#links)
      - [Families](#families)
      - [Data about persons](#data-about-persons)
      - [Access rights](#access-rights)

---

## Deutsch

### Einleitung

---

Das Projekt Family Chronicles ist der Versuch, ein Tool zur Verwaltung von Familien Stammbäumen zu entwickeln. Der Fokus liegt hierbei auf einer offenen API, die bestehende Standards unterstützen, aber auch ihre eigenen, komplexeren Schnittstellen liefern soll. Die Vision ist es, Instanzen der API durch Administratoren verknüpfbar zu machen, um so mehrere Familien Stammbäume zu einem großen ganzen zu formen.

---

### Anforderungen

#### Person

- Eine Person verfügt über eine eindeutige ID (GUID)
- Eine Person verfügt über einen Vor, Mittel- (kann mehrere enthaltnen) und Nachnamen
- Eine Person verfügt über ein Geburtsdatum
- Eine Person verfügt über ein Sterbedatum
- Eine Person verfügt über einen Geburtsort
- Eine Person verfügt über einen Sterbeort
- Eine Person verfügt über einen Sterbegrund

#### Verbindungen

- Eine Person kann zu mehreren anderen Personen verknüpft werden
- Eine Person kann von mehreren anderen Personen verknüpft werden
- Eine Person kann zu einer Familie verknüpft werden
- Eine Person kann von einer Familie verknüpft werden
- Eine Person kann bei der Verknüpfung verschiedenen Rollen zugeteilt werden (Mutter, Sohn, Stiefkind, etc.)
- Es gibt ein Startdatum für die Verknüpfungen
- Es gibt ein Enddatum für die Verknüpfungen

#### Familien

- Eine Familie verfügt über eine eindeutige ID (GUID)
- Eine Familie verfügt über einen Namen
- Eine Familie verfügt über eine Beschreibung
- Eine Familie definiert sich über die Nachnamen der Personen, die sie zusammen haben

#### Daten zu Personen

- Zu jeder Person können Bilder, Videos, Texte, etc. gespeichert werden, jehweils mit Beschreibung
- Auf diesen Medien können andere Personen referenziert ("Getaggt") werden

#### Zugriffsrechte

- Es gibt 3 Stufen der Zugriffsrechte:
  - Nur für Admins (volle Zugriffsrechte)
  - Nur für Editoren (nur Leserechte und Schreibrechte auf Personen und Familien)
  - Nur für Leser (nur Leserechte auf Personen und Familien)

---

## English

### Introduction

---

The Family Chronicles project is an attempt to develop a family tree management tool. The focus here is on an open API that should support existing standards, but also provide its own more complex interfaces. The vision is to make instances of the API linkable by administrators to form multiple family pedigrees into one big whole.

---

### Requirement

#### Persons

- A person has a unique ID (GUID).
- A person has a first, middle (can be more than one) and last name.
- A person has a date of birth
- A person has a date of death
- A person has a place of birth
- A person has a place of death
- A person has a reason for death

#### Links

- A person can be linked to several other persons
- A person can be linked by several other persons
- A person can be linked to a family
- A person can be linked by a family
- A person can be assigned to different roles when linked (mother, son, stepchild, etc.)
- There is a start date for the links
- There is an end date for the links

#### Families

- A family has a unique ID (GUID)
- A family has a name
- A family has a description
- A family is defined by the last names of the people who have it together

#### Data about persons

- For each person, pictures, videos, texts, etc. can be stored, each with a description.
- On these media other persons can be referenced ("tagged")

#### Access rights

- There are 3 levels of access rights:
  - Admins only (full access rights).
  - Editors only (read only and write access to persons and families)
  - Readers only (read only rights on persons and families)

---
