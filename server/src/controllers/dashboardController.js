import dashboardService from '../services/dashboardService.js';

class DashboardController {
  async getSummary(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const summary = await dashboardService.getDashboardSummary(companyId);
      res.status(200).json({ success: true, summary });
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
