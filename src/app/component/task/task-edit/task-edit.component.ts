import {Component, OnInit} from '@angular/core';
import {Task, TimeRange} from '../../../model/task';
import {TaskService} from '../../../service/task/task.service';
import {Router} from '@angular/router';
import {TaskUri} from '../../../uri/Uri';
import {Utils} from '../../../util/Utils';
import {Employee} from '../../../model/employee';
import {EmployeeService} from '../../../service/employee/employee.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ValidateInputNumber, ValidateInputText} from '../../../service/validator/CustomValidator';

/**
 *
 * TODO:
 * TODO 1. custom validator  for the estimate/date range
 * TODO 2. add css errors
 *
 */
@Component({
  selector: 'app-task-edit',
  styleUrls: ['./task-edit.component.css'],
  templateUrl: './task-edit.component.html'
})
export class TaskEditComponent implements OnInit {
  task: Task;
  updatedTask: Task;
  types: string[];
  statuses: string[];
  reportingPerson: Employee;
  responsiblePerson: Employee;
  editableTaskForm: FormGroup;

  constructor(private taskService: TaskService,
              private personService: EmployeeService,
              private formBuilder: FormBuilder,
              private router: Router) {
  }

  ngOnInit() {
    this.task = this.taskService.getTasks()[0];
    this.updatedTask = this.task;
    this.initDropDowns();
    this.getPersons();
    this.editableTaskForm = this.formBuilder.group(this.buildValidatorConfig(), {validator: this.validateDates});
    this.subscribeForFromChanges();

  }

  private initDropDowns() {
    this.types = Utils.setFirstInArray(this.taskService.getAvailableTaskTypes(), this.task.type);
    this.statuses = Utils.setFirstInArray(this.taskService.getAvailableStatuses(), this.task.status);
  }

  private getPersons() {
    this.reportingPerson = this.personService.getReportingPerson();
    this.responsiblePerson = this.personService.getResponsiblePerson();
  }

  private subscribeForFromChanges() {
    this.editableTaskForm.valueChanges.subscribe(value => {
      this.updatedTask = new Task(
        this.task.taskName,
        value['statusFormControl'],
        value['taskTypeFormControl'],
        value['taskEstimateFormControl'],
        new TimeRange(new Date(value['startDateFormControl']), new Date(value['endDateFormControl'])),
        value['taskDescriptionFormControl']
      );
      this.taskService.update(this.updatedTask);
      this.personService.setReportingPerson(null);
    });
  }

  private buildValidatorConfig() {
    return {
      statusFormControl: [this.task.status, Validators.required],
      taskTypeFormControl: [this.task.type, Validators.required],
      taskEstimateFormControl: [this.task.estimate, [Validators.required, ValidateInputNumber]],
      taskDescriptionFormControl: [this.task.description, [Validators.required, ValidateInputText]],
      startDateFormControl: [this.task.range.start, Validators.required],
      endDateFormControl: [this.task.range.end, Validators.required],
      responsiblePersonFormControl: [this.responsiblePerson, Validators.required],
      reportingPersonFormControl: [this.reportingPerson, Validators.required]
    };
  }

  private validateDates(group: FormGroup) {
    const startDate = new Date(group.get('startDateFormControl').value);
    const endDate = new Date(group.get('endDateFormControl').value);
    if (startDate.getTime() >= endDate.getTime()) {
      group.get('startDateFormControl').setErrors({startDateRequiredBefore: true})
    }
  }

  update() {
    console.log(this.updatedTask);
  }

  cancel() {
    this.router.navigate([TaskUri.VIEW_TASK]);
  }

  isNotValidDateRange(): boolean {
    return this.editableTaskForm.get('startDateFormControl').errors &&
      this.editableTaskForm.get('startDateFormControl').dirty &&
      this.editableTaskForm.get('startDateFormControl').errors.startDateRequiredBefore;
  }

  isNotValidDescription(): boolean {
    return this.editableTaskForm.get('taskDescriptionFormControl').errors &&
      this.editableTaskForm.get('taskDescriptionFormControl').dirty &&
      this.editableTaskForm.get('taskDescriptionFormControl').errors.validDescriptionRequired;
  }

  isNotValidEstimate(): boolean {
    return this.editableTaskForm.get('taskEstimateFormControl').errors &&
      this.editableTaskForm.get('taskEstimateFormControl').dirty &&
      this.editableTaskForm.get('taskEstimateFormControl').errors.validEstimateRequired;
  }
}
